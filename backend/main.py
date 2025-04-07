# ###################################################################################################
# AS CATEGORIAS NÃO VÊM DA API, VÊM DOS ARQUIVOS JSON: CATEGORIAS, NIVEL2 E NIVEL3                  #
# ###################################################################################################

import os
from fastapi import FastAPI
from backend.routes import router
from backend.utils.logs import setup_api_logs

# Configurar logs exclusivos para API
setup_api_logs()

# Criar a aplicação FastAPI
app = FastAPI(title="Sentinnell API")

# Incluir rotas
app.include_router(router)

@app.get("/health")
async def health_check():
    return {"status": "online"}
