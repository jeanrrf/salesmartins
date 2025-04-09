import sys
import os

# Add the parent directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.shopee_affiliate_auth import graphql_query, GraphQLRequest
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, Dict, Any, List
from fastapi.responses import JSONResponse

# Patch para compatibilidade com Werkzeug em Python 3.13
try:
    import werkzeug.urls
    if not hasattr(werkzeug.urls, 'url_quote'):
        if hasattr(werkzeug.urls, 'quote'):
            werkzeug.urls.url_quote = werkzeug.urls.quote
        else:
            from urllib.parse import quote
            werkzeug.urls.url_quote = quote
    print("API: Werkzeug url_quote patched successfully")
except ImportError:
    print("API: Failed to patch werkzeug.urls")

import json
import logging
import math
from datetime import datetime, timedelta
from backend.utils.database import save_product, get_products, get_db_connection

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Cache para armazenar resultados temporariamente
cache = {
    "products": None,
    "last_fetch": 0
}

def identify_hot_products(products, min_sales=50, recent_weight=0.6, commission_weight=0.2, price_value_weight=0.2):
    """
    Identifica produtos em alta com base em um algoritmo de pontuação.
    
    O algoritmo considera:
    1. Volume de vendas recentes
    2. Taxa de comissão (maior é melhor)
    3. Relação preço/valor (desconto e avaliações)
    
    Args:
        products: Lista de produtos da API da Shopee
        min_sales: Vendas mínimas para considerar um produto como potencialmente "em alta"
        recent_weight: Peso para o fator de vendas recentes
        commission_weight: Peso para o fator de comissão
        price_value_weight: Peso para o fator de preço/valor
    
    Returns:
        Lista de produtos em alta, ordenados pelo score
    """
    if not products:
        return []
    
    scored_products = []
    
    # Encontrar valores máximos para normalização
    max_sales = max((int(p.get('sales', 0)) for p in products), default=1) or 1
    max_commission = max((float(p.get('commissionRate', 0)) for p in products), default=0.01) or 0.01
    max_discount = max((float(p.get('priceDiscountRate', 0)) for p in products), default=1) or 1
    max_rating = max((float(p.get('ratingStar', 0)) for p in products), default=5) or 5
    
    for product in products:
        # Filtrar produtos com poucas vendas
        sales = int(product.get('sales', 0))
        if sales < min_sales:
            continue
            
        # 1. Fator de vendas recentes (normalizado)
        sales_score = sales / max_sales
        
        # 2. Fator de comissão (normalizado)
        commission = float(product.get('commissionRate', 0))
        commission_score = commission / max_commission
        
        # 3. Fator de preço/valor
        discount = float(product.get('priceDiscountRate', 0))
        rating = float(product.get('ratingStar', 0))
        
        # Normalizar desconto e avaliação
        discount_norm = discount / max_discount
        rating_norm = rating / max_rating
        
        # Combinar desconto e avaliação para o fator preço/valor
        price_value_score = (discount_norm * 0.7) + (rating_norm * 0.3)
        
        # Calcular pontuação final com os pesos
        total_score = (
            (sales_score * recent_weight) + 
            (commission_score * commission_weight) + 
            (price_value_score * price_value_weight)
        )
        
        # Adicionar produto com sua pontuação
        product['hotScore'] = round(total_score * 100, 2)  # Converter para percentual de 0-100
        scored_products.append(product)
    
    # Ordenar produtos por pontuação (do maior para o menor)
    hot_products = sorted(scored_products, key=lambda p: p.get('hotScore', 0), reverse=True)
    
    return hot_products

@app.get('/api/products')
async def get_all_products():
    """Get all products from the database"""
    try:
        products = await get_products()
        return products
    except Exception as e:
        logger.error(f"Error in get_all_products: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get('/api/products/search')
async def search_products(
    page: Optional[int] = 1,
    limit: Optional[int] = 10,
    sortType: Optional[int] = 2,
    keyword: Optional[str] = ''
):
    """Search products in database with filters"""
    try:
        filters = {}
        if keyword:
            filters['name'] = keyword
        
        sort_by = 'created_at' if sortType == 2 else 'price'
        
        products = await get_products(filters=filters, sort_by=sort_by, limit=limit)
        
        return {
            "products": products,
            "page": page,
            "limit": limit,
            "total": len(products),
            "hasNextPage": False  # Simplified pagination
        }
    except Exception as e:
        logger.error(f"Error in search_products: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post('/api/update-categories')
async def update_categories(request: Request):
    """Endpoint para atualizar categorias no banco de dados"""
    try:
        data = await request.json()
        
        if not data or 'products' not in data:
            return JSONResponse(content={'success': False, 'message': 'Dados inválidos. A requisição deve conter uma lista de produtos.'}, status_code=400)
            
        products = data['products']
        if not isinstance(products, list):
            return JSONResponse(content={'success': False, 'message': 'O campo products deve ser uma lista.'}, status_code=400)
            
        db_connector = get_db_connection()
        
        updated_count = 0
        failed_count = 0
        
        for product in products:
            try:
                if 'itemId' not in product or 'categoryId' not in product or 'categoryName' not in product:
                    failed_count += 1
                    continue
                    
                # Verificar se o produto já existe no banco
                cursor = db_connector.cursor()
                cursor.execute(
                    "SELECT id FROM products WHERE item_id = %s", 
                    (product['itemId'],)
                )
                
                result = cursor.fetchone()
                
                if result:
                    # Atualizar categoria do produto existente
                    cursor.execute(
                        """
                        UPDATE products 
                        SET category_id = %s, category_name = %s
                        WHERE item_id = %s
                        """,
                        (product['categoryId'], product['categoryName'], product['itemId'])
                    )
                    updated_count += 1
                else:
                    # Este produto ainda não existe no banco, então não pode ser atualizado
                    failed_count += 1
                    
                db_connector.commit()
                
            except Exception as e:
                failed_count += 1
                logger.error(f"Erro ao atualizar categoria do produto {product.get('itemId')}: {str(e)}")
                
        return JSONResponse(content={
            'success': True,
            'message': f'Processamento concluído. {updated_count} produtos atualizados com sucesso. {failed_count} falhas.',
            'updated_count': updated_count,
            'failed_count': failed_count
        })
    
    except Exception as e:
        logger.error(f"Erro ao processar requisição de atualização de categorias: {str(e)}")
        return JSONResponse(content={'success': False, 'message': f'Erro ao processar requisição: {str(e)}'}, status_code=500)

@app.get('/api/categories')
async def get_categories():
    """Endpoint para obter as categorias do arquivo CATEGORIA.json"""
    try:
        categories_path = os.path.join(os.path.dirname(__file__), 'CATEGORIA.json')
        
        if not os.path.exists(categories_path):
            return JSONResponse(content={'success': False, 'message': 'Arquivo de categorias não encontrado.'}, status_code=404)
            
        with open(categories_path, 'r', encoding='utf-8') as f:
            categories = json.load(f)
            
        return categories
    
    except Exception as e:
        logger.error(f"Erro ao carregar categorias: {str(e)}")
        return JSONResponse(content={'success': False, 'message': f'Erro ao carregar categorias: {str(e)}'}, status_code=500)

@app.post('/api/search')
async def search_shopee_products(request: Request):
    """Search products in Shopee Affiliate API with keyword"""
    try:
        data = await request.json()
        keyword = data.get('keyword', '')
        sort_type = data.get('sortType', 2)  # Default: Sales
        limit = data.get('limit', 20)
        min_price = data.get('minPrice')
        max_price = data.get('maxPrice')
        min_commission = data.get('minCommission')
        include_recommendations = data.get('includeRecommendations', False)
        
        if not keyword:
            return JSONResponse(content={'error': 'Keyword is required'}, status_code=400)
            
        # Preparar a consulta para a API Shopee
        query = GraphQLRequest().search_products(
            keyword=keyword, 
            sort_type=sort_type, 
            limit=limit
        )
        
        # Executar a consulta na API Shopee
        result = await graphql_query(query)
        
        if not result or 'data' not in result:
            return JSONResponse(content={'error': 'Failed to fetch data from Shopee API'}, status_code=500)
            
        # Processar os resultados
        products = []
        if 'data' in result and 'searchProducts' in result['data']:
            products = result['data']['searchProducts']['products']
            
            # Aplicar filtros de preço e comissão se especificados
            if min_price is not None or max_price is not None or min_commission is not None:
                filtered_products = []
                for product in products:
                    price = float(product.get('priceMin', 0))
                    commission = float(product.get('commissionRate', 0))
                    
                    price_min_ok = min_price is None or price >= min_price
                    price_max_ok = max_price is None or price <= max_price
                    commission_ok = min_commission is None or commission >= min_commission
                    
                    if price_min_ok and price_max_ok and commission_ok:
                        filtered_products.append(product)
                products = filtered_products
        
        # Verificar quais produtos já existem no banco de dados
        db_connector = get_db_connection()
        cursor = db_connector.cursor()
        
        # Extrair os item_ids dos produtos retornados pela API
        item_ids = [str(product.get('itemId')) for product in products]
        
        # Verificar quais desses IDs já existem no banco de dados
        if item_ids:
            placeholders = ', '.join(['%s'] * len(item_ids))
            query = f"SELECT item_id FROM products WHERE item_id IN ({placeholders})"
            cursor.execute(query, item_ids)
            existing_ids = [str(row[0]) for row in cursor.fetchall()]
            
            # Marcar produtos que já existem no banco
            for product in products:
                product['existsInDatabase'] = str(product.get('itemId')) in existing_ids
        else:
            # Se não houver produtos, não há nada para verificar
            for product in products:
                product['existsInDatabase'] = False
        
        cursor.close()
        
        # Buscar recomendações se solicitado
        recommendations = []
        if include_recommendations and products:
            # Usar o primeiro produto para gerar recomendações
            first_product = products[0]
            rec_query = GraphQLRequest().get_similar_products(first_product.get('itemId'))
            rec_result = await graphql_query(rec_query)
            
            if rec_result and 'data' in rec_result and 'similarProducts' in rec_result['data']:
                recommendations = rec_result['data']['similarProducts'].get('products', [])
        
        # Identificar produtos em alta
        hot_products = identify_hot_products(products)
        
        return {
            "products": products,
            "recommendations": recommendations,
            "hotProducts": hot_products
        }
    except Exception as e:
        logger.error(f"Error in search_shopee_products: {str(e)}")
        return JSONResponse(content={'error': str(e)}, status_code=500)

@app.post('/api/trending')
async def get_trending_products(request: Request):
    """Identify and return hot/trending products from Shopee API"""
    try:
        data = await request.json()
        keywords = data.get('keywords', [])  # Lista de palavras-chave para pesquisar
        category_ids = data.get('categoryIds', [])  # Lista de IDs de categorias
        min_sales = data.get('minSales', 50)  # Vendas mínimas para considerar
        limit_per_search = data.get('limitPerSearch', 40)  # Limite por pesquisa
        final_limit = data.get('limit', 20)  # Limite final de produtos retornados
        exclude_existing = data.get('excludeExisting', True)  # Excluir produtos existentes por padrão
        
        all_products = []
        
        # 1. Buscar por palavras-chave populares
        for keyword in keywords:
            if not keyword:
                continue
                
            # Usar o endpoint de busca existente com o parâmetro para ordenar por vendas
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
                }
            }
            """
            
            variables = {
                "keyword": keyword,
                "sortType": 3,  # Ordenar por mais vendidos
                "limit": limit_per_search
            }
            
            graphql_request = GraphQLRequest(
                query=query,
                variables=variables
            )
            
            result = await graphql_query(graphql_request)
            
            if result and 'data' in result and 'productOfferV2' in result['data']:
                products = result['data']['productOfferV2'].get('nodes', [])
                all_products.extend(products)
                
        # 2. Buscar por categorias populares (complementar às buscas por palavra-chave)
        for category_id in category_ids:
            # Usar GraphQL para buscar produtos por categoria
            category_query = """
            query ProductsByCategory($categoryId: String!, $sortType: Int!, $limit: Int!) {
                productOfferV2(categoryId: $categoryId, sortType: $sortType, limit: $limit) {
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
            
            variables = {
                "categoryId": category_id,
                "sortType": 3,  # Ordenar por mais vendidos
                "limit": limit_per_search // 2  # Metade do limite por categoria
            }
            
            category_request = GraphQLRequest(
                query=category_query,
                variables=variables
            )
            
            category_result = await graphql_query(category_request)
            
            if category_result and 'data' in category_result and 'productOfferV2' in category_result['data']:
                products = category_result['data']['productOfferV2'].get('nodes', [])
                all_products.extend(products)
                
        # 3. Remover duplicatas (produtos que apareceram em múltiplas buscas)
        unique_products = {}
        for product in all_products:
            item_id = str(product.get('itemId'))
            # Manter apenas uma instância de cada produto (a última encontrada)
            unique_products[item_id] = product
            
        all_products = list(unique_products.values())
        
        # 4. Se solicitado, filtrar produtos já existentes no banco de dados
        if exclude_existing and all_products:
            # Extrair os item_ids dos produtos
            item_ids = list(unique_products.keys())
            
            db_connector = get_db_connection()
            cursor = db_connector.cursor()
            
            # Verificar quais desses IDs já existem no banco de dados
            if item_ids:
                placeholders = ', '.join(['%s'] * len(item_ids))
                query = f"SELECT shopee_id FROM products WHERE shopee_id IN ({placeholders})"
                cursor.execute(query, item_ids)
                existing_ids = {str(row[0]) for row in cursor.fetchall()}
                
                # Filtrar produtos existentes
                all_products = [p for p in all_products if str(p.get('itemId')) not in existing_ids]
            
            cursor.close()
            
        # 5. Aplicar algoritmo de identificação de produtos em alta
        hot_products = identify_hot_products(all_products, min_sales=min_sales)
        
        # 6. Limitar ao número final solicitado
        hot_products = hot_products[:final_limit]
        
        # 7. Adicionar metadados à resposta
        response = {
            "products": hot_products,
            "metadata": {
                "totalFound": len(all_products),
                "uniqueProducts": len(unique_products),
                "trendingCount": len(hot_products),
                "keywords": keywords,
                "categories": category_ids,
                "timestamp": datetime.now().isoformat()
            }
        }
        
        return response
    except Exception as e:
        logger.error(f"Error in get_trending_products: {str(e)}")
        return JSONResponse(content={'error': str(e)}, status_code=500)

@app.post('/api/repair-logs')
async def save_repair_logs(request: Request):
    """Endpoint para salvar os logs de reparo no arquivo repair-logs.json"""
    try:
        data = await request.json()
        
        if not data or 'repairedItems' not in data:
            raise HTTPException(
                status_code=400,
                detail="Dados inválidos. A requisição deve conter 'repairedItems'."
            )
        
        # Salvar no arquivo repair-logs.json
        current_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        logs_path = os.path.join(current_dir, 'repair-logs.json')
        
        with open(logs_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
            
        return JSONResponse(content={'success': True, 'message': 'Logs salvos com sucesso'})
    
    except Exception as e:
        logger.error(f"Erro ao salvar logs de reparo: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao salvar logs: {str(e)}"
        )

@app.get('/api/repair-logs')
async def get_repair_logs():
    """Endpoint para obter os logs de reparo do arquivo repair-logs.json"""
    try:
        current_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        logs_path = os.path.join(current_dir, 'repair-logs.json')
        
        if not os.path.exists(logs_path):
            # Se o arquivo não existir, criar com estrutura inicial
            with open(logs_path, 'w', encoding='utf-8') as f:
                json.dump({"repairedItems": []}, f, indent=2, ensure_ascii=False)
        
        with open(logs_path, 'r', encoding='utf-8') as f:
            logs = json.load(f)
            
        return logs
        
    except Exception as e:
        logger.error(f"Erro ao carregar logs de reparo: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao carregar logs: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)