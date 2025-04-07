# ###################################################################################################
# Arquivo: api.py                                                                               #
# Descrição: Este script define a API backend usando FastAPI.                                    #
# Autor: Jean Rosso                                                                              #
# Data: 28 de março de 2025                                                                      #
# ###################################################################################################

from fastapi import FastAPI
from backend.api.routes import router
from backend.utils.cors_middleware import setup_cors

app = FastAPI(title="Sentinnell API")

# Configurar CORS
setup_cors(app)

# Incluir rotas
app.include_router(router)