# ###################################################################################################
# Arquivo: api.py                                                                               #
# Descrição: Este script define a API backend usando FastAPI.                                    #
# Autor: Jean Rosso                                                                              #
# Data: 28 de março de 2025                                                                      #
# ###################################################################################################

import sys
import os
import logging
import json
import time
from datetime import datetime
from pathlib import Path
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from typing import Dict, Any, Optional, List
from fastapi.responses import JSONResponse

# Importar a instância FastAPI do arquivo shopee_affiliate_auth
from .shopee_affiliate_auth import app, graphql_query, GraphQLRequest, get_db_connection

# Configure logging (mantenha apenas aqui, remova do shopee_affiliate_auth)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Cache para armazenar resultados temporariamente
cache = {
    "products": None,
    "last_fetch": 0
}

# Cache para categorias
_category_cache = {
    "nivel1": None,
    "nivel2": None,
    "nivel3": None,
    "last_updated": 0
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

def get_categories_from_json(level=1):
    """
    Carrega categorias de arquivos JSON baseado no nível desejado
    
    Args:
        level: Nível das categorias (1, 2 ou 3)
    
    Returns:
        Lista de categorias do nível especificado
    """
    # Verificar se o cache está válido (menos de 5 minutos)
    cache_key = f"nivel{level}"
    current_time = time.time()
    
    if _category_cache[cache_key] and current_time - _category_cache["last_updated"] < 300:
        logger.info(f"Retornando categorias nivel {level} do cache")
        return _category_cache[cache_key]
    
    try:
        # Caminho base do projeto
        base_path = Path(__file__).parent
        
        if level == 1:
            filepath = base_path / "CATEGORIA.json"
        elif level == 2:
            filepath = base_path / "subCategorias" / "NVL2" / "nivel2.json"
        elif level == 3:
            filepath = base_path / "subCategorias" / "NVL3" / "nivel3.json"
        else:
            raise ValueError(f"Nível de categoria inválido: {level}")
        
        if not filepath.exists():
            logger.warning(f"Arquivo de categorias não encontrado: {filepath}")
            return []
            
        with open(filepath, 'r', encoding='utf-8') as f:
            categories = json.load(f)
            
        # Atualizar cache
        _category_cache[cache_key] = categories
        _category_cache["last_updated"] = current_time
        
        logger.info(f"Carregadas {len(categories)} categorias de nível {level}")
        return categories
    except Exception as e:
        logger.error(f"Erro ao carregar categorias de nível {level}: {str(e)}")
        return []

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

@app.get('/api/categories')
@app.get("/categories")
async def get_categories():
    """Endpoint para obter todas as categorias cadastradas"""
    try:
        # Carregar categorias do arquivo JSON
        categories = get_categories_from_json(level=1)
        
        if not categories:
            logger.warning("Nenhuma categoria encontrada no arquivo JSON")
            
        return categories
    except Exception as e:
        logger.error(f"Erro ao buscar categorias: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao buscar categorias: {str(e)}"
        )

@app.get('/api/categories/nivel2')
@app.get("/categories/nivel2")
async def get_categories_level2():
    """Endpoint para obter todas as subcategorias de nível 2"""
    try:
        categories = get_categories_from_json(level=2)
        return categories
    except Exception as e:
        logger.error(f"Erro ao buscar categorias de nível 2: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao buscar categorias de nível 2: {str(e)}"
        )

@app.get('/api/categories/nivel3')
@app.get("/categories/nivel3")
async def get_categories_level3():
    """Endpoint para obter todas as subcategorias de nível 3"""
    try:
        categories = get_categories_from_json(level=3)
        return categories
    except Exception as e:
        logger.error(f"Erro ao buscar categorias de nível 3: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao buscar categorias de nível 3: {str(e)}"
        )

@app.get("/db/categories")
async def get_all_categories():
    """Endpoint para obter todas as categorias (L1, L2 e L3) juntas"""
    try:
        categories = []
        
        # Carregar categorias L1
        l1_categories = get_categories_from_json(level=1)
        if l1_categories:
            categories.extend(l1_categories)
        
        # Carregar categorias L2
        l2_categories = get_categories_from_json(level=2)
        if l2_categories:
            categories.extend(l2_categories)
        
        # Carregar categorias L3
        l3_categories = get_categories_from_json(level=3)
        if l3_categories:
            categories.extend(l3_categories)
        
        logger.info(f"Retornando {len(categories)} categorias de todos os níveis")
        return categories
    except Exception as e:
        logger.error(f"Erro ao buscar todas as categorias: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao buscar todas as categorias: {str(e)}"
        )

@app.get("/health")
async def health_check():
    """Endpoint para verificar se a API está funcionando"""
    return {"status": "ok", "message": "API is running"}

@app.post('/search')
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
        logger.error(f"Erro na busca: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao buscar produtos: {str(e)}"
        )

@app.post('/api/search')
async def api_search_shopee_products(request: Request):
    """Search products in Shopee Affiliate API with parameters"""
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
            
        # Criar uma requisição para o endpoint de busca existente
        # Criando um objeto GraphQLRequest válido
        search_request = {
            "keyword": keyword,
            "sortType": sort_type,
            "limit": limit,
            "page": 1,
            "minPrice": min_price,
            "maxPrice": max_price,
            "minCommission": min_commission,
            "includeRecommendations": include_recommendations
        }
        
        from .shopee_affiliate_auth import SearchRequest
        
        # Criar um objeto válido do modelo SearchRequest
        valid_request = SearchRequest(**search_request)
        
        # Chamar o método de pesquisa existente
        from .shopee_affiliate_auth import search_products
        
        result = await search_products(valid_request)
        return result
        
    except Exception as e:
        logger.error(f"Erro na busca: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao buscar produtos: {str(e)}"
        )

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