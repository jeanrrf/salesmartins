# ###################################################################################################
# Arquivo: shopee_affiliate_auth.py                                                              #
# Descrição: Este script lida com a autenticação e as rotas da API para o programa de afiliados Shopee. #
# Autor: Jean Rosso                                                                              #
# Data: 28 de março de 2025                                                                      #
# ###################################################################################################

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
    try:
        conn = sqlite3.connect('shopee-analytics.db')
        cursor = conn.cursor()

        # Create products table if it doesn't exist
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            item_id TEXT UNIQUE,
            name TEXT,
            price REAL,
            image_url TEXT,
            shop_name TEXT,
            commission_rate REAL,
            category_id TEXT,
            category_name TEXT,
            product_url TEXT,
            affiliate_link TEXT,
            sales INTEGER DEFAULT 0,
            metadata TEXT,
            created_at TIMESTAMP,
            updated_at TIMESTAMP
        )
        ''')

        # Create offers table if it doesn't exist
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

        # Create shops table if it doesn't exist
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS shops (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            shop_id TEXT UNIQUE,
            shop_name TEXT,
            image_url TEXT,
            commission_rate REAL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        ''')

        conn.commit()
        conn.close()

        logger.info("Database initialized successfully")
    except Exception as e:
        logger.critical(f"Failed to initialize database: {str(e)}")
        raise

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
    query: str  # Campo obrigatório
    variables: Optional[Dict[str, Any]] = None
    operationName: Optional[str] = None
    
    # Adicionar método para criar consulta de pesquisa
    def search_products(self, keyword: str, sort_type: int = 2, limit: int = 20):
        """Cria uma consulta GraphQL para buscar produtos"""
        self.query = """
        query searchProducts($keyword: String!, $sortType: Int, $limit: Int, $page: Int) {
            productOfferV2(keyword: $keyword, sortType: $sortType, limit: $limit, page: $page) {
                nodes {
                    itemId
                    productName
                    commissionRate
                    sellerCommissionRate
                    shopeeCommissionRate
                    sales
                    priceMin
                    priceMax
                    productCatIds
                    ratingStar
                    priceDiscountRate
                    imageUrl
                    shopId
                    shopName
                    shopType
                    productLink
                    offerLink
                    periodStartTime
                    periodEndTime
                }
                pageInfo {
                    page
                    limit
                    hasNextPage
                }
            }
        }
        """
        self.variables = {
            "keyword": keyword,
            "sortType": sort_type,
            "limit": limit,
            "page": 1
        }
        return self

    # Adicionar método para buscar produtos similares
    def get_similar_products(self, item_id: str):
        """Cria uma consulta GraphQL para buscar produtos similares"""
        self.query = """
        query similarProducts($itemId: Int64!) {
            similarProducts(itemId: $itemId) {
                products {
                    itemId
                    productName
                    commissionRate
                    sales
                    priceMin
                    priceMax
                    imageUrl
                    shopName
                    offerLink
                    ratingStar
                }
            }
        }
        """
        self.variables = {
            "itemId": int(item_id)
        }
        return self

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

class SearchRequest(BaseModel):
    keyword: str
    sortType: Optional[int] = 0  # RELEVANCE_DESC = 1, ITEM_SOLD_DESC = 2, etc
    limit: Optional[int] = 20
    minPrice: Optional[float] = None
    maxPrice: Optional[float] = None
    minCommission: Optional[float] = None
    includeRecommendations: Optional[bool] = False
    page: Optional[int] = 1
    productCatId: Optional[int] = None
    shopId: Optional[int] = None
    isAMSOffer: Optional[bool] = None
    isKeySeller: Optional[bool] = None

@app.post("/search")
async def search_products(request: SearchRequest):
    """
    Endpoint para buscar produtos com base em palavras-chave usando a API GraphQL da Shopee
    """
    try:
        # Query GraphQL para buscar produtos
        query = """
        query searchProducts($keyword: String!, $sortType: Int, $limit: Int, $page: Int) {
            productOfferV2(keyword: $keyword, sortType: $sortType, limit: $limit, page: $page) {
                nodes {
                    itemId
                    productName
                    commissionRate
                    sellerCommissionRate
                    shopeeCommissionRate
                    sales
                    priceMin
                    priceMax
                    productCatIds
                    ratingStar
                    priceDiscountRate
                    imageUrl
                    shopId
                    shopName
                    shopType
                    productLink
                    offerLink
                    periodStartTime
                    periodEndTime
                }
                pageInfo {
                    page
                    limit
                    hasNextPage
                }
            }
        }
        """
        
        # Variáveis para a consulta GraphQL
        variables = {
            "keyword": request.keyword,
            "sortType": request.sortType,
            "limit": request.limit,
            "page": request.page
        }
        
        # Adicionar filtros opcionais se fornecidos
        if request.productCatId:
            variables["productCatId"] = request.productCatId
        if request.shopId:
            variables["shopId"] = request.shopId
        if request.isAMSOffer is not None:
            variables["isAMSOffer"] = request.isAMSOffer
        if request.isKeySeller is not None:
            variables["isKeySeller"] = request.isKeySeller
        
        # Criar a requisição GraphQL
        graphql_request = GraphQLRequest(
            query=query,
            variables=variables
        )
        
        # Usar o endpoint GraphQL interno
        result = await graphql_query(graphql_request)
        
        if not result or "data" not in result:
            raise HTTPException(
                status_code=500, 
                detail="Falha ao obter dados da API da Shopee"
            )
        
        # Filtrar produtos por preço e comissão, se especificado
        products = result.get("data", {}).get("productOfferV2", {}).get("nodes", [])
        page_info = result.get("data", {}).get("productOfferV2", {}).get("pageInfo", {})
        filtered_products = []
        
        for product in products:
            # Converter preços para números
            price_min = float(product.get("priceMin", "0")) if product.get("priceMin") else 0
            price_max = float(product.get("priceMax", "0")) if product.get("priceMax") else 0
            commission_rate = float(product.get("commissionRate", "0")) if product.get("commissionRate") else 0
            
            # Aplicar filtros
            if (request.minPrice is None or price_min >= request.minPrice) and \
               (request.maxPrice is None or price_max <= request.maxPrice) and \
               (request.minCommission is None or commission_rate >= request.minCommission):
                
                # Formatar preços para exibição
                product["price"] = price_min  # Para compatibilidade com o frontend
                product["priceFormatted"] = f"R$ {price_min:.2f}"
                
                # Processar dados da loja para formato mais amigável
                if "shopType" in product and product["shopType"]:
                    shop_types = []
                    shop_type_codes = product["shopType"]
                    if 1 in shop_type_codes:
                        shop_types.append("Loja Oficial")
                    if 2 in shop_type_codes:
                        shop_types.append("Loja Preferida")
                    if 4 in shop_type_codes:
                        shop_types.append("Loja Premium")
                    product["shopTypeLabels"] = shop_types
                
                filtered_products.append(product)
        
        # Buscar recomendações se solicitado
        recommendations = []
        if request.includeRecommendations and filtered_products:
            # Usar o primeiro produto para buscar recomendações
            first_product_id = filtered_products[0].get("itemId")
            if first_product_id:
                rec_query = """
                query similarProducts($itemId: Int64!) {
                    similarProducts(itemId: $itemId) {
                        products {
                            itemId
                            productName
                            commissionRate
                            sales
                            priceMin
                            priceMax
                            imageUrl
                            shopName
                            offerLink
                            ratingStar
                        }
                    }
                }
                """
                
                rec_request = GraphQLRequest(
                    query=rec_query,
                    variables={"itemId": first_product_id}
                )
                
                rec_result = await graphql_query(rec_request)
                if rec_result and "data" in rec_result and "similarProducts" in rec_result["data"]:
                    recommendations = rec_result["data"]["similarProducts"].get("products", [])
        
        return {
            "products": filtered_products,
            "totalCount": len(filtered_products),
            "recommendations": recommendations,
            "pageInfo": page_info
        }
        
    except Exception as e:
        logger.error(f"Erro na busca: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao buscar produtos: {str(e)}"
        )

@app.post("/shops")
async def search_shops(
    keyword: Optional[str] = None,
    shopId: Optional[int] = None,
    shopType: Optional[List[int]] = None,
    isKeySeller: Optional[bool] = None,
    sortType: Optional[int] = 1,  # LATEST_DESC = 1 por padrão
    page: Optional[int] = 1,
    limit: Optional[int] = 20,
    sellerCommCoveRatio: Optional[str] = None
):
    """
    Endpoint para buscar lojas usando a API GraphQL da Shopee
    """
    try:
        # Query GraphQL para buscar lojas
        query = """
        query searchShops($keyword: String, $shopId: Int64, $shopType: [Int], $isKeySeller: Bool, 
                         $sortType: Int, $page: Int, $limit: Int, $sellerCommCoveRatio: String) {
            shopOfferV2(keyword: $keyword, shopId: $shopId, shopType: $shopType, isKeySeller: $isKeySeller,
                      sortType: $sortType, page: $page, limit: $limit, sellerCommCoveRatio: $sellerCommCoveRatio) {
                nodes {
                    commissionRate
                    imageUrl
                    offerLink
                    originalLink
                    shopId
                    shopName
                    ratingStar
                    shopType
                    remainingBudget
                    periodStartTime
                    periodEndTime
                    sellerCommCoveRatio
                }
                pageInfo {
                    page
                    limit
                    hasNextPage
                }
            }
        }
        """
        
        # Variáveis para a consulta GraphQL
        variables = {
            "sortType": sortType,
            "page": page,
            "limit": limit
        }
        
        # Adicionar parâmetros opcionais se fornecidos
        if keyword:
            variables["keyword"] = keyword
        if shopId:
            variables["shopId"] = shopId
        if shopType:
            variables["shopType"] = shopType
        if isKeySeller is not None:
            variables["isKeySeller"] = isKeySeller
        if sellerCommCoveRatio:
            variables["sellerCommCoveRatio"] = sellerCommCoveRatio
        
        # Criar a requisição GraphQL
        graphql_request = GraphQLRequest(
            query=query,
            variables=variables
        )
        
        # Usar o endpoint GraphQL interno
        result = await graphql_query(graphql_request)
        
        if not result or "data" not in result:
            raise HTTPException(
                status_code=500, 
                detail="Falha ao obter dados de lojas da API da Shopee"
            )
        
        shops = result.get("data", {}).get("shopOfferV2", {}).get("nodes", [])
        page_info = result.get("data", {}).get("shopOfferV2", {}).get("pageInfo", {})
        
        # Processar dados para formato mais amigável
        for shop in shops:
            if "remainingBudget" in shop:
                budget_code = shop["remainingBudget"]
                if budget_code == 0:
                    shop["budgetStatus"] = "Ilimitado"
                elif budget_code == 3:
                    shop["budgetStatus"] = "Normal (>50%)"
                elif budget_code == 2:
                    shop["budgetStatus"] = "Baixo (<50%)"
                elif budget_code == 1:
                    shop["budgetStatus"] = "Muito Baixo (<30%)"
        
        return {
            "shops": shops,
            "pageInfo": page_info
        }
        
    except Exception as e:
        logger.error(f"Erro na busca de lojas: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao buscar lojas: {str(e)}"
        )

@app.post("/offers")
async def get_offers(
    keyword: Optional[str] = None,
    sortType: Optional[int] = 1,  # LATEST_DESC = 1 por padrão
    page: Optional[int] = 1,
    limit: Optional[int] = 20
):
    """
    Endpoint para buscar ofertas usando a API GraphQL
    """
    try:
        # Query GraphQL para buscar ofertas
        query = """
        query getOffers($keyword: String, $sortType: Int, $page: Int, $limit: Int) {
            shopeeOfferV2(keyword: $keyword, sortType: $sortType, page: $page, limit: $limit) {
                nodes {
                    commissionRate
                    offerName
                    imageUrl
                    offerLink
                    originalLink
                    offerType
                    categoryId
                    collectionId
                    periodStartTime
                    periodEndTime
                }
                pageInfo {
                    page
                    limit
                    hasNextPage
                }
            }
        }
        """
        
        # Variáveis para a consulta GraphQL
        variables = {
            "page": page,
            "limit": limit
        }
        
        if keyword:
            variables["keyword"] = keyword
        if sortType:
            variables["sortType"] = sortType
        
        # Criar a requisição GraphQL
        graphql_request = GraphQLRequest(
            query=query,
            variables=variables
        )
        
        # Usar o endpoint GraphQL interno
        result = await graphql_query(graphql_request)
        
        if not result or "data" not in result:
            raise HTTPException(
                status_code=500, 
                detail="Falha ao obter ofertas da API da Shopee"
            )
        
        offers = result.get("data", {}).get("shopeeOfferV2", {}).get("nodes", [])
        page_info = result.get("data", {}).get("shopeeOfferV2", {}).get("pageInfo", {})
        
        # Processa os tipos de oferta para formato mais amigável
        for offer in offers:
            if "offerType" in offer:
                offer_type = offer["offerType"]
                if offer_type == 1:
                    offer["offerTypeLabel"] = "Coleção"
                elif offer_type == 2:
                    offer["offerTypeLabel"] = "Categoria"
        
        # Salvar no banco de dados (opcional)
        conn = sqlite3.connect('shopee-analytics.db')
        cursor = conn.cursor()
        
        for offer in offers:
            cursor.execute(
                "INSERT OR REPLACE INTO offers (offer_name, commission_rate, image_url, offer_link) VALUES (?, ?, ?, ?)",
                (offer.get("offerName"), offer.get("commissionRate"), offer.get("imageUrl"), offer.get("offerLink"))
            )
        
        conn.commit()
        conn.close()
        
        return {
            "offers": offers,
            "pageInfo": page_info
        }
        
    except Exception as e:
        logger.error(f"Erro ao buscar ofertas: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao buscar ofertas: {str(e)}"
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

# Definir modelo para receber os dados do produto
class ProductData(BaseModel):
    product: Dict[str, Any]

@app.post("/db/products")
async def save_product_to_db(data: ProductData):
    """
    Endpoint para salvar um produto no banco de dados local
    """
    try:
        product_data = data.product
        
        # Extrair os campos necessários
        shopee_id = str(product_data.get('itemId', ''))
        name = product_data.get('productName', '')
        price = float(product_data.get('priceMin', 0))
        image_url = product_data.get('imageUrl', '')
        shop_name = product_data.get('shopName', '')
        commission_rate = float(product_data.get('commissionRate', 0))
        category_id = product_data.get('categoryId', '')
        category_name = product_data.get('categoryName', '')
        product_url = product_data.get('productLink', '')
        affiliate_link = product_data.get('affiliateLink', '')
        sales = int(product_data.get('sales', 0))
        product_metadata = product_data.get('productMetadata', '{}')
        
        # Salvar o produto no banco de dados
        conn = sqlite3.connect('shopee-analytics.db')
        cursor = conn.cursor()
        
        cursor.execute('''
        INSERT OR REPLACE INTO products 
        (item_id, name, price, image_url, shop_name, commission_rate, 
         category_id, category_name, product_url, affiliate_link, sales, metadata, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        ''', (
            shopee_id, name, price, image_url, shop_name, commission_rate,
            category_id, category_name, product_url, affiliate_link, sales, product_metadata
        ))
        
        conn.commit()
        conn.close()
        
        logger.info(f"Produto {shopee_id} salvo com sucesso!")
        
        return {
            "success": True,
            "message": f"Produto {name} salvo com sucesso!"
        }
        
    except Exception as e:
        logger.error(f"Erro ao salvar produto: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao salvar produto: {str(e)}"
        )

if __name__ == "__main__":
    import argparse
    import uvicorn

    parser = argparse.ArgumentParser(description='Shopee Affiliate API Server')
    parser.add_argument('--host', type=str, default='0.0.0.0', help='Host to run the server on')
    parser.add_argument('--port', type=int, default=8001, help='Port to run the server on')
    args = parser.parse_args()

    logger.info(f"Starting Shopee Affiliate API server on {args.host}:{args.port}...")
    uvicorn.run(app, host=args.host, port=args.port)