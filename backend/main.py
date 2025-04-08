# ###################################################################################################
# AS CATEGORIAS NÃO VÊM DA API, VÊM DOS ARQUIVOS JSON: CATEGORIAS, NIVEL2 E NIVEL3                  #
# ###################################################################################################

import os
import json
from fastapi import FastAPI, Response
from backend.routes import router
from backend.utils.logs import setup_api_logs
from backend.cors_middleware import setup_cors_for_app, setup_static_files

# Configurar logs exclusivos para API
setup_api_logs()

# Criar a aplicação FastAPI
app = FastAPI(title="Sentinnell API")

# Configurar CORS
app = setup_cors_for_app(app)

# Define path to mock data
project_root = os.path.dirname(os.path.dirname(__file__))
mock_data_dir = os.path.join(project_root, "backend", "mock_data")
os.makedirs(mock_data_dir, exist_ok=True)

# Mount static files for mock data
app = setup_static_files(app, mock_data_dir)

# Incluir rotas
app.include_router(router)

@app.get("/health")
async def health_check():
    return {"status": "online"}

# Add API endpoint that serves the same mock data
@app.get("/api/products")
async def get_products(minSales: str = None, maxCommission: str = None, similarityThreshold: str = None):
    try:
        # Parse and validate minSales
        try:
            min_sales = 0 if minSales in [None, ""] else int(minSales)
            if min_sales < 0:
                min_sales = 0
        except ValueError:
            min_sales = 0
            
        # Parse and validate maxCommission
        try:
            max_commission = 100 if maxCommission in [None, ""] else int(maxCommission)
            if max_commission < 0:
                max_commission = 0
            elif max_commission > 100:
                max_commission = 100
        except ValueError:
            max_commission = 100
            
        # Parse and validate similarityThreshold
        try:
            similarity_threshold = 0 if similarityThreshold in [None, ""] else int(similarityThreshold)
            if similarity_threshold < 0:
                similarity_threshold = 0
            elif similarity_threshold > 100:
                similarity_threshold = 100
        except ValueError:
            similarity_threshold = 0
        
        print(f"API request received with params: minSales={min_sales}, maxCommission={max_commission}, similarityThreshold={similarity_threshold}")
        
        mock_file = os.path.join(mock_data_dir, "products.json")
        if os.path.exists(mock_file):
            with open(mock_file, 'r') as f:
                data = json.load(f)
                
                # Apply filters to the mock data
                if data and "data" in data:
                    filtered_data = [
                        product for product in data["data"] 
                        if product.get("sales", 0) >= min_sales and 
                           product.get("commission", 0) <= max_commission
                    ]
                    return {"data": filtered_data}
                return data
        else:
            return {"data": [], "error": "Mock data file not found"}
    except Exception as e:
        print(f"Error in API endpoint: {str(e)}")
        # Return a JSON response even in case of error
        return {"data": [], "error": f"Error loading mock data: {str(e)}"}
