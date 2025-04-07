from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

def setup_cors(app: FastAPI):
    """Setup CORS middleware with configuration from environment."""
    # Origens permitidas por padrão
    default_origins = [
        "https://salesmartins.onrender.com",
        "http://localhost:8001",
        "http://localhost:5000",
        "http://localhost:8000"
    ]
    
    # Se existir configuração no ambiente, usar ela
    allowed_origins = os.getenv("CORS_ALLOW_ORIGINS", "").split(",")
    if not allowed_origins or allowed_origins[0] == "":
        allowed_origins = default_origins
    
    # Se "*" estiver em allowed_origins, FastAPI trata corretamente
    if "*" in allowed_origins:
        allowed_origins = ["*"]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["*"]
    )
