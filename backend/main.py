# ###################################################################################################
# Arquivo: main.py                                                                                  #
# Descrição: Ponto de entrada principal da API                                                      #
# Autor: Jean Rosso                                                                                 #
# Data: 7 de abril de 2025                                                                          #
# ###################################################################################################

import os
import json
from fastapi import FastAPI, Response, HTTPException, Query
from typing import Optional
from fastapi.middleware.cors import CORSMiddleware
from backend.routes import router
from backend.utils.logs import setup_api_logs
from backend.utils.api_client import get_products_from_api, get_categories_from_api
from backend.utils.inventory import get_inventory_items
from requests.exceptions import RequestException

# Configurar logs exclusivos para API
setup_api_logs()

# Criar a aplicação FastAPI
app = FastAPI(title="Sentinnell API")

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change this in production to specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir rotas
app.include_router(router)

@app.get("/health")
async def health_check():
    return {"status": "online"}

# API endpoint that connects to real data
@app.get("/api/products")
async def get_products(
    query: Optional[str] = None,
    sortBy: Optional[str] = Query("most-sold", enum=["most-sold", "highest-discount"]),
    hideInventoryItems: bool = True
):
    try:
        print(f"API request received with params: query={query}, sortBy={sortBy}, hideInventoryItems={hideInventoryItems}")
        
        # Get data from real API
        products_data = await get_products_from_api(sort_by=sortBy)
        
        # Filter products that are already in inventory if requested
        if hideInventoryItems:
            inventory_items = get_inventory_items()
            inventory_ids = set(item["id"] for item in inventory_items)
            
            if "data" in products_data:
                products_data["data"] = [
                    product for product in products_data["data"] 
                    if str(product.get("id")) not in inventory_ids
                ]
        
        # Filter by text search if provided
        if query and query.strip() and "data" in products_data:
            query = query.lower().strip()
            products_data["data"] = [
                product for product in products_data["data"]
                if query in product.get("name", "").lower() or 
                   query in product.get("description", "").lower() or
                   query in product.get("shopName", "").lower()
            ]
        
        return products_data
        
    except RequestException as e:
        raise HTTPException(status_code=503, detail=f"Service unavailable: {str(e)}")
    except Exception as e:
        print(f"Error in API endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/api/categories")
async def get_categories():
    """Get all categories from the real API"""
    try:
        return await get_categories_from_api()
    except RequestException as e:
        raise HTTPException(status_code=503, detail=f"Service unavailable: {str(e)}")
    except Exception as e:
        print(f"Error in categories endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
