"""
Database utility module.

This module contains functions for creating and managing database sessions,
saving and updating products, and searching for products with filters and sorting.
"""
from sqlalchemy.orm import sessionmaker, Session
from backend.models import Base, Product, engine, DB_PATH, save_memory_db_to_disk
import json
from datetime import datetime
import logging
import sqlite3
import os

# Configuração de logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# Usando o mesmo engine definido em models.py
logger.info(f"Tentando conectar ao banco de dados em: {DB_PATH}")

# Create a local session to interact with the database
SessionLocal = sessionmaker(bind=engine)

def get_db() -> Session:
    """
    Generator function to get a database session.
    Ensures that the session is closed after use.
    """
    logger.info("Iniciando nova sessão do banco de dados")
    db = SessionLocal()
    try:
        yield db
    finally: 
        logger.info("Fechando sessão do banco de dados")
        db.close()
        
        # Salvar para o disco se estiver usando banco em memória
        if os.environ.get('RENDER') == "1" and DB_PATH == ":memory:":
            save_memory_db_to_disk()

def test_connection():
    """
    Test database connection and print database info
    """
    try:
        logger.info("Testando conexão com o banco de dados...")
        
        # Se estiver no Render com banco em memória, use o engine SQLAlchemy
        if os.environ.get('RENDER') == "1" and DB_PATH == ":memory:":
            conn = engine.raw_connection().connection
            cursor = conn.cursor()
            logger.info("✅ Usando banco de dados em memória no ambiente Render")
        else:
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            logger.info(f"✅ Usando banco de dados no arquivo: {DB_PATH}")
        
        # Get database info
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        
        logger.info(f"Conexão bem sucedida! Tabelas encontradas: {tables}")
        
        # Test query on products table
        cursor.execute("SELECT COUNT(*) FROM products;")
        count = cursor.fetchone()[0]
        logger.info(f"Número de produtos no banco: {count}")
        
        return True
    except Exception as e:
        logger.error(f"❌ Erro ao conectar com o banco de dados: {str(e)}")
        return False
    finally:
        if 'conn' in locals():
            if not (os.environ.get('RENDER') == "1" and DB_PATH == ":memory:"):
                conn.close()

def get_db_connection():
    """
    Returns a direct SQLite connection for use with functions that need a raw connection.
    This function is used by API endpoints that require direct SQL queries.
    """
    if os.environ.get('RENDER') == "1" and DB_PATH == ":memory:":
        # Use SQLAlchemy engine's raw connection for in-memory database
        conn = engine.raw_connection().connection
    else:
        # Use direct SQLite connection for file-based database
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row  # This enables accessing columns by name
    return conn

async def save_product(product_data, affiliate_data=None):
    """
    Salva ou atualiza um produto no banco de dados.

    Args:
        product_data (dict): Dados do produto da API da Shopee.
        affiliate_data (dict, optional): Dados opcionais do link de afiliado (short_link, sub_ids). Defaults to None.
    """
    db = next(get_db())

    try:
        # Verificar se o produto já existe
        product_id = str(product_data.get('itemId'))
        if not product_id:
            raise ValueError("Produto não possui itemId")
            
        product = db.query(Product).filter_by(shopee_id=product_id).first()
        
        # Preparar os dados do produto
        new_product_data = {
            'shopee_id': product_id,
            'name': product_data.get('productName', ''),
            'price': float(product_data.get('priceMin', 0)),
            'original_price': float(product_data.get('priceMax', 0)),
            'category_id': int(product_data.get('productCatIds', [0])[0] if product_data.get('productCatIds') else 0),
            'shop_id': int(product_data.get('shopId', 0)),
            'stock': int(product_data.get('stock', 0)),
            'commission_rate': float(product_data.get('commissionRate', 0)),
            'sales': int(product_data.get('sales', 0)),
            'image_url': product_data.get('imageUrl', ''),
            'shop_name': product_data.get('shopName', ''),
            'offer_link': product_data.get('offerLink', ''),
            'rating_star': float(product_data.get('ratingStar', 0)),
            'price_discount_rate': float(product_data.get('priceDiscountRate', 0)),
            'item_status': product_data.get('itemStatus', ''),
            'discount': product_data.get('discount', ''),
            'product_link': product_data.get('productLink', ''),
            'period_start_time': product_data.get('periodStartTime', None),
            'period_end_time': product_data.get('periodEndTime', None),
            'shop_type': product_data.get('shopType', ''),
            'seller_commission_rate': product_data.get('sellerCommissionRate', 0),
            'shopee_commission_rate': product_data.get('shopeeCommissionRate', 0),
            'affiliate_link': product_data.get('affiliateLink', ''),
            'product_metadata': product_data.get('metadata', {})
        }
        
        # Adicionar dados de afiliado se fornecidos
        if affiliate_data:
            new_product_data.update({
                'short_link': affiliate_data.get('short_link', ''),
                'sub_ids': json.dumps(affiliate_data.get('sub_ids', []))
            })
        
        if not product:
            # Criar novo produto
            product = Product(**new_product_data)
            db.add(product)
        else:
            # Atualizar produto existente
            for key, value in new_product_data.items():
                if hasattr(product, key) and value is not None:
                    setattr(product, key, value)
            product.updated_at = datetime.utcnow()
        
        db.commit()
        return True
    except Exception as e:
        db.rollback()
        logger.error(f"Error saving product: {str(e)}")
        return False
    finally:
        db.close()

async def get_products(filters=None, sort_by=None, limit=None):
    """Busca produtos no banco de dados com filtros opcionais"""
    db = next(get_db())
    try:
        query = db.query(Product)
        
        # Aplicar filtros se fornecidos
        if filters:
            for key, value in filters.items():
                if hasattr(Product, key):
                    query = query.filter(getattr(Product, key).like(f'%{value}%'))
        
        # Aplicar ordenação se fornecida
        if sort_by:
            field, direction = sort_by
            if hasattr(Product, field):
                order_by = getattr(Product, field)
                if direction == 'desc':
                    order_by = order_by.desc()
                query = query.order_by(order_by)
        
        # Aplicar limite se fornecido
        if limit:
            query = query.limit(limit)
        
        logger.info(f"Query antes da execução: {query}")
        products = query.all()
        
        # Converter para dicionário e tratar campos JSON
        result = []
        for product in products:
            product_dict = {
                'id': product.id,
                'shopee_id': product.shopee_id,
                'name': product.name,
                'price': product.price,
                'original_price': product.original_price,
                'category_id': product.category_id,
                'shop_id': product.shop_id,
                'stock': product.stock,
                'commission_rate': product.commission_rate,
                'sales': product.sales,
                'image_url': product.image_url,
                'shop_name': product.shop_name,
                'offer_link': product.offer_link,
                'short_link': product.short_link,
                'rating_star': product.rating_star,
                'price_discount_rate': product.price_discount_rate,
                'sub_ids': json.loads(product.sub_ids) if product.sub_ids else [],
                'created_at': product.created_at,
                'updated_at': product.updated_at,
                'item_status': product.item_status,
                'discount': product.discount,
                'product_link': product.product_link,
                'period_start_time': product.period_start_time,
                'period_end_time': product.period_end_time,
                'shop_type': product.shop_type,
                'seller_commission_rate': product.seller_commission_rate,
                'shopee_commission_rate': product.shopee_commission_rate,
                'affiliate_link': product.affiliate_link,
                'product_metadata': product.product_metadata
            }
            result.append(product_dict)
        logger.info(f"get_products retorno: {result}")
        return result
    except Exception as e:
        logger.error(f"Error getting products: {str(e)}")
        return []
    finally:
        pass
