import os
import logging
import hmac
import hashlib
import requests
import time
import json
import sqlite3
import sys
from pathlib import Path

# Add the project root to the Python path
project_root = str(Path(__file__).parent.parent)
if project_root not in sys.path:
    sys.path.insert(0, project_root)

# Use absolute imports
from backend.utils.database import save_product, get_products
from backend.models import Base, Product

from fastapi import FastAPI, HTTPException, Request
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from sqlalchemy import create_engine
from typing import Dict, Any, Optional, List, Union

# Configurar logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment variables from the correct path
current_dir = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(current_dir, '.env')
load_dotenv(env_path)

# Load and validate environment variables
def load_env_variables():
    required_vars = [
        "SHOPEE_APP_ID",
        "SHOPEE_APP_SECRET",
        "SHOPEE_AFFILIATE_API_URL",
        "TOKEN_ENCRYPTION_KEY"
    ]

    env_vars = {}
    for var in required_vars:
        value = os.getenv(var)
        if not value:
            logger.error(f"Missing required environment variable: {var}")
            raise ValueError(f"Environment variable {var} is not set.")
        env_vars[var] = value

    return env_vars

# Load environment variables
try:
    env_vars = load_env_variables()
    SHOPEE_APP_ID = env_vars["SHOPEE_APP_ID"]
    SHOPEE_SECRET = env_vars["SHOPEE_APP_SECRET"]
    SHOPEE_AFFILIATE_API_URL = env_vars["SHOPEE_AFFILIATE_API_URL"]
    TOKEN_ENCRYPTION_KEY = env_vars["TOKEN_ENCRYPTION_KEY"]
except ValueError as e:
    logger.critical(str(e))
    raise

# Initialize SQLite database
def init_db():
    conn = sqlite3.connect('shopee-analytics.db')
    cursor = conn.cursor()
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS offers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        offer_name TEXT,
        commission_rate REAL,
        image_url TEXT,
        offer_link TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS categories (
        id VARCHAR PRIMARY KEY,
        name TEXT NOT NULL,
        level INTEGER
    )
    ''')
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        shopee_id VARCHAR UNIQUE NOT NULL,
        name VARCHAR,
        price FLOAT,
        original_price FLOAT,
        category_id INTEGER,
        shop_id INTEGER,
        stock INTEGER,
        commission_rate FLOAT,
        sales INTEGER,
        image_url VARCHAR,
        shop_name VARCHAR,
        offer_link VARCHAR,
        short_link VARCHAR,
        rating_star FLOAT,
        price_discount_rate FLOAT,
        sub_ids VARCHAR,
        product_link TEXT,
        period_start_time DATETIME,
        period_end_time DATETIME,
        shop_type VARCHAR,
        seller_commission_rate FLOAT,
        shopee_commission_rate FLOAT,
        affiliate_link VARCHAR,
        product_metadata TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP,
        item_status VARCHAR,
        discount VARCHAR
    )
    ''')
    
    # Load categories from CATEGORIA.json and populate categories table
    try:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        categories_path = os.path.join(current_dir, 'CATEGORIA.json')
        with open(categories_path, 'r', encoding='utf-8') as f:
            categories = json.load(f)
            
        # Insert or update categories
        for category in categories:
            cursor.execute("""
                INSERT OR REPLACE INTO categories (id, name, level)
                VALUES (?, ?, ?)
            """, (category['id'], category['name'], category['level']))
            
    except Exception as e:
        logger.error(f"Error loading categories: {str(e)}")
        
    conn.commit()
    conn.close()

# Initialize database
init_db()

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://salesmartins.onrender.com",
        "http://localhost:8001",
        "http://localhost:5000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Montar os arquivos estáticos do frontend
frontend_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend")
app.mount("/", StaticFiles(directory=frontend_path, html=True), name="frontend")

class GraphQLRequest(BaseModel):
    query: str
    variables: Optional[Dict[str, Any]] = None
    operationName: Optional[str] = None

def generate_signature(app_id: str, timestamp: int, payload: str, secret: str) -> str:
    """
    Gera a assinatura SHA256 no formato:
    SHA256(Credential+Timestamp+Payload+Secret)
    """
    base_string = f"{app_id}{timestamp}{payload}{secret}"
    signature = hashlib.sha256(base_string.encode('utf-8')).hexdigest()
    logger.debug(f"Generated signature components:")
    logger.debug(f"App ID: {app_id}")
    logger.debug(f"Timestamp: {timestamp}")
    logger.debug(f"Payload: {payload}")
    logger.debug(f"Base string: {base_string}")
    logger.debug(f"Signature: {signature}")
    return signature

def create_auth_header(payload: str = "") -> dict:
    """
    Cria o cabeçalho de autorização no formato:
    Authorization: SHA256 Credential={Appid}, Timestamp={Timestamp}, Signature={signature}
    """
    timestamp = int(time.time())
    signature = generate_signature(SHOPEE_APP_ID, timestamp, payload, SHOPEE_SECRET)
    
    auth_header = f"SHA256 Credential={SHOPEE_APP_ID}, Timestamp={timestamp}, Signature={signature}"
    return {
        "Authorization": auth_header,
        "Content-Type": "application/json"
    }

@app.get("/")
def read_root():
    return {"message": "Shopee Affiliate API - Data Viewer"}

@app.get("/health")
async def health_check():
    """
    Endpoint para verificar se o servidor está funcionando
    """
    return {"status": "ok", "timestamp": time.time()}

@app.post("/graphql")
async def graphql_query(request: GraphQLRequest):
    try:
        # Preparar o payload
        payload = json.dumps(request.dict(exclude_none=True))
        
        # Criar cabeçalhos com autenticação
        headers = create_auth_header(payload)
        
        logger.debug(f"Request payload: {payload}")
        logger.debug(f"Headers: {json.dumps(headers, indent=2)}")
        
        # Fazer a requisição para a API da Shopee
        response = requests.post(
            SHOPEE_AFFILIATE_API_URL,
            data=payload,
            headers=headers
        )
        
        logger.debug(f"Shopee API Response: {response.status_code} - {response.text}")
        
        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Erro na requisição: {response.text}"
            )
            
        response_data = response.json()
        
        # Check if this is a generateShortLink mutation
        if "generateShortLink" in str(request.query):
            try:
                # Extract the mutation data
                data = response_data.get("data", {}).get("generateShortLink", {})
                variables = request.variables or {}
                
                # Get product data if available in variables
                product_data = variables.get("productData", {})
                original_url = variables.get("input", {}).get("originUrl", "")
                sub_ids = variables.get("input", {}).get("subIds", [])
                short_link = data.get("shortLink", "")
                
                if product_data and original_url and short_link:
                    # Save to database
                    await save_product(product_data, original_url, short_link, sub_ids)
                    logger.info(f"Successfully saved product link to database: {short_link}")
            except Exception as e:
                logger.error(f"Error saving product link: {str(e)}")
                # Don't raise exception here, just log it
                
        return response_data
    
    except Exception as e:
        logger.error(f"Error in graphql_query: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao executar query GraphQL: {str(e)}"
        )

@app.get("/test-offers")
async def test_offers():
    """
    Endpoint de teste para buscar ofertas usando a API GraphQL
    """
    try:
        # Query GraphQL para buscar ofertas
        query = """
        {
            shopeeOfferV2 {
                nodes {
                    commissionRate
                    offerName
                    imageUrl
                    offerLink
                }
                pageInfo {
                    page
                    limit
                    hasNextPage
                }
            }
        }
        """
        
        # Criar a requisição GraphQL
        request = GraphQLRequest(query=query)
        
        # Usar o endpoint GraphQL interno
        return await graphql_query(request)
        
    except Exception as e:
        logger.error(f"Error in test_offers: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao testar ofertas: {str(e)}"
        )

@app.get("/offers")
async def get_offers():
    """
    Endpoint para buscar ofertas usando a API GraphQL e salvar no banco de dados
    """
    try:
        # Query GraphQL para buscar ofertas
        query = """
        {
            shopeeOfferV2 {
                nodes {
                    commissionRate
                    offerName
                    imageUrl
                    offerLink
                }
                pageInfo {
                    page
                    limit
                    hasNextPage
                }
            }
        }
        """
        
        # Criar a requisição GraphQL
        request = GraphQLRequest(query=query)
        
        # Usar o endpoint GraphQL interno
        result = await graphql_query(request)
        
        # Save to database
        conn = sqlite3.connect('shopee-analytics.db')
        cursor = conn.cursor()
        
        for offer in result.get("data", {}).get("shopeeOfferV2", {}).get("nodes", []):
            cursor.execute(
                "INSERT INTO offers (offer_name, commission_rate, image_url, offer_link) VALUES (?, ?, ?, ?)",
                (offer.get("offerName"), offer.get("commissionRate"), offer.get("imageUrl"), offer.get("offerLink"))
            )
        
        conn.commit()
        conn.close()
        
        return result
        
    except Exception as e:
        logger.error(f"Error getting offers: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Dicionário em cache para armazenar categorias e produtos
cache = {
    "categories": None,
    "products": None,
    "last_fetch": 0
}

@app.get("/cached/products")
async def get_cached_products():
    """Get products from cache"""
    if cache["products"] is None:
        raise HTTPException(status_code=404, detail="Nenhum produto em cache. Faça uma busca primeiro.")
        
    cache_age = int(time.time()) - cache["last_fetch"]
    return {
        "products": cache["products"], 
        "cache_age_seconds": cache_age
    }

@app.get("/product/{item_id}")
async def get_product(item_id: int):
    """
    Endpoint para buscar um produto específico por ID
    """
    try:
        # Query GraphQL para buscar um produto específico
        query = """
        query GetProduct($itemId: Int!) {
            productOfferV2(itemId: $itemId) {
                nodes {
                    productName
                    itemId
                    commissionRate
                    commission
                    price
                    sales
                    imageUrl
                    shopName
                    productLink
                    offerLink
                    periodStartTime
                    periodEndTime
                    priceMin
                    priceMax
                    productCatIds
                    ratingStar
                    priceDiscountRate
                    shopId
                    shopType
                    sellerCommissionRate
                    shopeeCommissionRate
                }
            }
        }
        """
        
        variables = {"itemId": item_id}
        
        # Criar a requisição GraphQL
        request = GraphQLRequest(
            query=query,
            variables=variables
        )
        
        # Usar o endpoint GraphQL interno
        return await graphql_query(request)
        
    except Exception as e:
        logger.error(f"Error in get_product: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao buscar produto: {str(e)}"
        )

@app.get("/db/offers")
async def get_db_offers():
    """Get offers from local database"""
    conn = sqlite3.connect('shopee-analytics.db')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM offers ORDER BY created_at DESC LIMIT 100")
    offers = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return {"offers": offers}

@app.get("/db/products")
async def get_db_products():
    """Get products from local database"""
    conn = sqlite3.connect('shopee-analytics.db')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM products ORDER BY created_at DESC LIMIT 100")
    products = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return {"products": products}

@app.put("/db/products/{product_id}")
async def update_db_product(product_id: int, data: Dict[str, Any]):
    """Update product in local database"""
    conn = sqlite3.connect('shopee-analytics.db')
    cursor = conn.cursor()
    
    # Construir a parte SET da query SQL com base nos campos fornecidos
    set_parts = []
    update_values = []
    
    # Verificar quais campos foram enviados na requisição
    if 'name' in data:
        set_parts.append("product_name = ?")
        update_values.append(data['name'])
    if 'category_id' in data:
        set_parts.append("category_id = ?")
        update_values.append(data['category_id'])
    if 'price' in data:
        set_parts.append("price = ?")
        update_values.append(float(data['price']))
    if 'original_price' in data:
        set_parts.append("original_price = ?")
        update_values.append(float(data['original_price']))
    if 'stock' in data:
        set_parts.append("stock = ?")
        update_values.append(int(data['stock']))
    
    if not set_parts:
        # Se nenhum campo foi fornecido para atualização
        return {"error": "Nenhum dado fornecido para atualização"}
    
    # Adicionar timestamp de atualização
    set_parts.append("updated_at = CURRENT_TIMESTAMP")
    # Adicionar o ID à lista de valores
    update_values.append(product_id)

    try:
        # Executar a query de atualização
        query = f"UPDATE products SET {', '.join(set_parts)} WHERE id = ?"
        cursor.execute(query, update_values)
        conn.commit()
        
        # Verificar se algum registro foi atualizado
        if cursor.rowcount == 0:
            conn.close()
            return {"error": "Produto não encontrado"}
            
        # Buscar o produto atualizado
        cursor.execute("SELECT * FROM products WHERE id = ?", (product_id,))
        product = cursor.fetchone()
        conn.close()
        
        if product:
            return {
                "id": product[0],
                "name": product[1],
                "price": product[2],
                "original_price": product[3],
                "category_id": product[4],
                "shop_id": product[5],
                "stock": product[6],
                "shopee_id": product[7],
                "updated_at": product[9]
            }
        return {"message": "Produto atualizado com sucesso"}
        
    except Exception as e:
        conn.rollback()
        conn.close()
        logger.error(f"Error updating product: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao atualizar produto: {str(e)}")

@app.get("/categories")
async def get_categories():
    """
    Endpoint para retornar as categorias disponíveis do arquivo CATEGORIA.json
    """
    try:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        categories_path = os.path.join(current_dir, 'CATEGORIA.json')
        with open(categories_path, 'r', encoding='utf-8') as f:
            categories = json.load(f)
        return categories
    except Exception as e:
        logger.error(f"Erro ao carregar categorias: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao carregar categorias: {str(e)}"
        )

@app.get("/product-history/{shopee_id}")
async def get_product_link_history(shopee_id: str):
    """
    Endpoint para buscar o histórico de links de um produto
    """
    try:
        history = await get_products(shopee_id)
        if not history:
            raise HTTPException(status_code=404, detail="Produto não encontrado")
        return history
    except Exception as e:
        logger.error(f"Error getting product history: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

class SearchRequest(BaseModel):
    keyword: str
    sortType: int
    limit: int
    minPrice: Optional[float] = None
    maxPrice: Optional[float] = None
    minCommission: Optional[float] = None
    includeRecommendations: bool = False
    excludeExisting: bool = False  # Novo parâmetro para excluir produtos existentes
    hotProductsOnly: bool = False  # Novo parâmetro para filtrar produtos em alta

@app.post("/search")
async def search_products(request: SearchRequest):
    try:
        # Main search query
        query = """
        query SearchProducts($keyword: String!, $sortType: Int!, $limit: Int!) {
            productOfferV2(keyword: $keyword, sortType: $sortType, limit: $limit) {
                nodes {
                    productName
                    itemId
                    commissionRate
                    sales
                    imageUrl
                    shopName
                    offerLink
                    priceMin
                    priceMax
                    ratingStar
                    priceDiscountRate
                    productCatIds
                }
                pageInfo {
                    page
                    limit
                    hasNextPage
                }
            }
        }
        """
        # Se o cliente solicitou exclusão de produtos existentes, aumentamos o limite de busca
        query_limit = request.limit * 2 if request.excludeExisting else request.limit
        variables = {
            "keyword": request.keyword,
            "sortType": request.sortType,
            "limit": query_limit
        }
        # Create GraphQL request
        graphql_request = GraphQLRequest(
            query=query,
            variables=variables
        )
        # Use existing graphql_query endpoint
        result = await graphql_query(graphql_request)
        # Extract products from response
        products = result.get("data", {}).get("productOfferV2", {}).get("nodes", [])
        page_info = result.get("data", {}).get("productOfferV2", {}).get("pageInfo", {})
        # Apply additional filters
        if products:
            filtered_products = []
            for product in products:
                price = float(product.get("priceMin", 0))
                commission = float(product.get("commissionRate", 0))
                # Apply price filter
                if request.minPrice is not None and price < request.minPrice:
                    continue
                if request.maxPrice is not None and price > request.maxPrice:
                    continue
                # Apply commission filter
                if request.minCommission is not None and commission < request.minCommission:
                    continue
                filtered_products.append(product)
                    
            products = filtered_products
                
        # Verificar quais produtos já existem no banco de dados se solicitado
        if request.excludeExisting:
            # Extrair os item_ids dos produtos
            item_ids = [str(product.get('itemId')) for product in products]
            if item_ids:
                # Conectar ao banco de dados
                conn = sqlite3.connect('shopee-analytics.db')
                cursor = conn.cursor()
                # Consultar produtos existentes
                placeholders = ', '.join(['?' for _ in item_ids])
                cursor.execute(f"SELECT shopee_id FROM products WHERE shopee_id IN ({placeholders})", item_ids)
                existing_ids = {str(row[0]) for row in cursor.fetchall()}
                # Filtrar produtos existentes
                products = [p for p in products if str(p.get('itemId')) not in existing_ids]
                # Marcar produtos que já existem
                for product in products:
                    product['existsInDatabase'] = str(product.get('itemId')) in existing_ids
                conn.close()
                
                logger.info(f"Filtered out {len(existing_ids)} existing products from results")
                
        # Aplicar filtro de produtos em alta, se solicitado
        if request.hotProductsOnly:
            # Importar a função de identificação de produtos em alta
            from .api import identify_hot_products
            products = identify_hot_products(products)
            logger.info(f"Filtered for hot products, returned {len(products)} items")
        # Limitar ao número originalmente solicitado após filtros
        products = products[:request.limit]
        # Get recommendations if requested
        recommendations = []
        if request.includeRecommendations and products:
            # Get categories from found products
            categories = set()
            for product in products[:3]:  # Use top 3 products for recommendations
                if product.get("productCatIds"):
                    categories.update(product["productCatIds"])
            if categories:
                # Query for recommended products
                rec_query = """
                query RecommendedProducts($categoryIds: [String!]!, $limit: Int!) {
                    productOfferV2(categoryIds: $categoryIds, sortType: 2, limit: $limit) {
                        nodes {
                            productName
                            itemId
                            commissionRate
                            sales
                            imageUrl
                            shopName
                            offerLink
                            priceMin
                            priceMax
                            ratingStar
                            priceDiscountRate
                            productCatIds
                        }
                    }
                }
                """
                rec_request = GraphQLRequest(
                    query=rec_query,
                    variables={
                        "categoryIds": list(categories),
                        "limit": 6  # Get top 6 recommendations
                    }
                )
                rec_result = await graphql_query(rec_request)
                recommendations = rec_result.get("data", {}).get("productOfferV2", {}).get("nodes", [])
                # Filter out products that are already in the main results
                product_ids = {p["itemId"] for p in products}
                recommendations = [r for r in recommendations if r["itemId"] not in product_ids]
                # Também filtrar recomendações já existentes, se solicitado
                if request.excludeExisting:
                    # Extrair os item_ids das recomendações
                    rec_item_ids = [str(rec.get('itemId')) for rec in recommendations]
                    if rec_item_ids:
                        # Conectar ao banco de dados
                        conn = sqlite3.connect('shopee-analytics.db')
                        cursor = conn.cursor()
                        # Consultar produtos existentes
                        placeholders = ', '.join(['?' for _ in rec_item_ids])
                        cursor.execute(f"SELECT shopee_id FROM products WHERE shopee_id IN ({placeholders})", rec_item_ids)
                        existing_rec_ids = {str(row[0]) for row in cursor.fetchall()}
                        # Filtrar recomendações existentes
                        recommendations = [r for r in recommendations if str(r.get('itemId')) not in existing_rec_ids]
                        conn.close()
                        
        return {
            "products": products,
            "recommendations": recommendations[:6],  # Limit to 6 recommendations
            "pageInfo": page_info
        }
    except Exception as e:
        logger.error(f"Error in search_products: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao buscar produtos: {str(e)}"
        )

from backend.utils import database

@app.post("/db/products")
async def save_product(data: dict):
    """Save product to database"""
    try:
        product_data = data.get('product')
        affiliate_data = {
            'short_link': product_data.get('affiliateLink', ''),
            'sub_ids': product_data.get('subIds', {})
        }
        # Debug log para ver os dados recebidos
        logger.debug(f"Received product data: {product_data}")
        # Salvar o produto e o link no banco de dados
        success = await database.save_product(product_data, affiliate_data)
        if not success:
            raise HTTPException(status_code=500, detail="Erro ao salvar produto no banco de dados")
        return {"success": True, "message": "Produto salvo com sucesso"}

    except Exception as e:
        logger.error(f"Error saving product: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao salvar produto: {str(e)}")

@app.get("/db/products/category/{category_id}")
async def get_products_by_category(category_id: str):
    """Get products by category ID from local database"""
    conn = sqlite3.connect('shopee-analytics.db')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM products WHERE category_id = ? ORDER BY created_at DESC LIMIT 100", (category_id,))
        products = [dict(row) for row in cursor.fetchall()]
        return products
    except Exception as e:
        logger.error(f"Error getting products by category: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar produtos por categoria: {str(e)}")
    finally:
        conn.close()

@app.get("/db/products/search")
async def search_db_products(q: str = None):
    """Search products by name in local database"""
    if not q or len(q.strip()) < 3:
        return []
    conn = sqlite3.connect('shopee-analytics.db')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    try:
        # Busca simples por parte do nome do produto
        cursor.execute("SELECT * FROM products WHERE product_name LIKE ? ORDER BY created_at DESC LIMIT 20", (f'%{q}%',))
        products = [dict(row) for row in cursor.fetchall()]
        return products
    except Exception as e:
        logger.error(f"Error searching products: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar produtos: {str(e)}")
    finally:
        conn.close()

@app.get("/db/products-with-category-issues")
async def get_products_with_category_issues():
    """Get products that have missing or invalid category IDs"""
    conn = sqlite3.connect('shopee-analytics.db')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # Get products with missing or invalid category_id
    cursor.execute("""
        SELECT p.* FROM products p
        LEFT JOIN categories c ON CAST(p.category_id AS TEXT) = c.id
        WHERE p.category_id IS NULL 
        OR p.category_id = ''
        OR c.id IS NULL
        ORDER BY p.created_at DESC
    """)
    products = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return products

if __name__ == "__main__":
    import argparse
    import uvicorn

    parser = argparse.ArgumentParser(description='Shopee Affiliate API Server')
    parser.add_argument('--host', type=str, default='0.0.0.0', help='Host to run the server on')
    parser.add_argument('--port', type=int, default=8001, help='Port to run the server on')
    args = parser.parse_args()

    logger.info(f"Starting Shopee Affiliate API server on {args.host}:{args.port}...")
    uvicorn.run(app, host=args.host, port=args.port)