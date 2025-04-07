import os
import importlib
import uvicorn
from fastapi import FastAPI
from cors_middleware import setup_cors

def create_app():
    """Criar e configurar a aplicação FastAPI principal"""
    app = FastAPI(title="Sentinnell API")
    
    # Configurar CORS
    setup_cors(app)
    
    # Importar rotas de outros módulos
    try:
        from api import app as api_app
        # Incluir todas as rotas da api.py
        app.mount("/api", api_app)
    except ImportError:
        print("Módulo api.py não encontrado")
    
    @app.get("/health")
    def health_check():
        return {"status": "ok"}
    
    return app

app = create_app()

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
