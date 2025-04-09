"""
Database utility module.

This module contains functions for creating and managing database sessions,
saving and updating products, and searching for products with filters and sorting.
"""
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy import create_engine
from ..models import Base, Product
import json
from datetime import datetime
import logging
import sqlite3
from .datetime_utils import safe_fromisoformat

# Configuração de logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# Database engine configuration (SQLite)
engine = create_engine('sqlite:///shopee-analytics.db')
# Create a local session to interact with the database
SessionLocal = sessionmaker(bind=engine)

def get_db() -> Session:
    """
    Generator function to get a database session.
    Ensures that the session is closed after use.
    """
    db = SessionLocal()
    try:
        yield db
    finally: 
        db.close()

def get_db_connection():
    """
    Returns a direct SQLite connection for use with functions that need a raw connection.
    This function is used by API endpoints that require direct SQL queries.
    """
    conn = sqlite3.connect('shopee-analytics.db')
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

async def get_products(limit: int = None, offset: int = 0, search: str = None):
    try:
        # Build the query based on parameters
        query = "SELECT * FROM products"
        params = []
        
        # Add search condition if provided
        if search:
            query += " WHERE (name LIKE ? OR product_name LIKE ? OR category_name LIKE ?)"
            search_param = f"%{search}%"
            params.extend([search_param, search_param, search_param])
        
        # Add limit and offset
        if limit is not None:
            query += f" LIMIT ?"
            params.append(limit)
            
        if offset > 0:
            query += f" OFFSET ?"
            params.append(offset)
        
        logging.getLogger(__name__).info(f"Query antes da execução: {query}")
        
        # Get database connection and execute query
        conn = get_db_connection()
        cursor = conn.cursor()
        if params:
            cursor.execute(query, params)
        else:
            cursor.execute(query)
            
        rows = cursor.fetchall()
        
        # Get column names
        column_names = [description[0] for description in cursor.description]
        
        products = []
        for row in rows:
            # Convert row to dictionary using column names
            product = dict(zip(column_names, row))
            
            # Safely parse datetime fields
            for date_field in ['period_start_time', 'period_end_time', 'created_at', 'updated_at']:
                if date_field in product:
                    product[date_field] = safe_fromisoformat(product[date_field])
            
            products.append(product)
        
        conn.close()
        return products
    except Exception as e:
        logging.getLogger(__name__).error(f"Error getting products: {str(e)}")
        # Return empty list instead of raising error to keep application functioning
        return []
