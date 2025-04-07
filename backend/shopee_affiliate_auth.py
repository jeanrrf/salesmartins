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
from datetime import datetime

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

# Importar e usar a função setup_cors
from cors_middleware import setup_cors
setup_cors(app)

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

# Exportar a função get_db_connection para uso no api.py
def get_db_connection():
    """Cria e retorna uma conexão com o banco de dados SQLite"""
    conn = sqlite3.connect('shopee-analytics.db')
    conn.row_factory = sqlite3.Row  # Para retornar dicts em vez de tuplas
    return conn

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

@app.post("/update-categories")
async def update_categories(data: dict):
    """
    Endpoint para atualizar as categorias dos produtos no banco de dados
    """
    try:
        if not data.get("products"):
            raise HTTPException(
                status_code=400,
                detail="Dados de produtos não fornecidos"
            )

        conn = sqlite3.connect('shopee-analytics.db')
        cursor = conn.cursor()
        
        # Atualização dos produtos no banco de dados
        updated_count = 0
        skipped_count = 0
        error_count = 0
        
        for product in data["products"]:
            try:
                # Verificar se o produto já existe no banco
                cursor.execute("SELECT * FROM products WHERE item_id = ?", (product["itemId"],))
                existing_product = cursor.fetchone()
                
                if existing_product:
                    # Se o produto já existe e já foi processado, podemos pular
                    if "processed" in product and product["processed"]:
                        skipped_count += 1
                        continue
                        
                    # Construir a query de atualização
                    update_fields = []
                    update_values = []
                    
                    # Adicionar campos a serem atualizados
                    if "categoryId" in product:
                        update_fields.append("category_id = ?")
                        update_values.append(product["categoryId"])
                    
                    if "categoryIdLevel2" in product:
                        update_fields.append("category_id_level2 = ?")
                        update_values.append(product["categoryIdLevel2"])
                    
                    if "categoryIdLevel3" in product:
                        update_fields.append("category_id_level3 = ?")
                        update_values.append(product["categoryIdLevel3"])
                    
                    if "categoryName" in product:
                        update_fields.append("category_name = ?")
                        update_values.append(product["categoryName"])
                    
                    # Marcar como processado
                    update_fields.append("processed = ?")
                    update_values.append(True)
                    
                    # Adicionar timestamp de atualização
                    update_fields.append("updated_at = ?")
                    update_values.append(datetime.now().isoformat())
                    
                    # Adicionar o item_id para a cláusula WHERE
                    update_values.append(product["itemId"])
                    
                    # Executar a atualização apenas se houver campos para atualizar
                    if update_fields:
                        cursor.execute(
                            f"UPDATE products SET {', '.join(update_fields)} WHERE item_id = ?",
                            tuple(update_values)
                        )
                        updated_count += 1
                else:
                    # O produto não existe no banco, registrar como erro
                    error_count += 1
                    logger.warning(f"Produto com ID {product['itemId']} não encontrado no banco de dados")
            
            except Exception as e:
                error_count += 1
                logger.error(f"Erro ao atualizar categoria para produto {product.get('itemId')}: {str(e)}")
        
        # Commit das alterações
        conn.commit()
        conn.close()
        
        return {
            "success": True, 
            "updated": updated_count, 
            "skipped": skipped_count,
            "errors": error_count,
            "message": f"{updated_count} produtos atualizados, {skipped_count} ignorados, {error_count} erros"
        }
        
    except Exception as e:
        logger.error(f"Erro ao atualizar categorias: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao atualizar categorias: {str(e)}"
        )

# Exportar as classes e funções principais para uso no api.py
__all__ = ['app', 'graphql_query', 'GraphQLRequest', 'get_db_connection']

if __name__ == "__main__":
    import argparse
    import uvicorn

    parser = argparse.ArgumentParser(description='Shopee Affiliate API Server')
    parser.add_argument('--host', type=str, default='0.0.0.0', help='Host to run the server on')
    parser.add_argument('--port', type=int, default=8001, help='Port to run the server on')
    args = parser.parse_args()

    logger.info(f"Starting Shopee Affiliate API server on {args.host}:{args.port}...")
    uvicorn.run(app, host=args.host, port=args.port)