from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

def setup_cors(app: FastAPI):
    """Setup CORS middleware with configuration from environment."""
    allowed_origins = os.getenv("CORS_ALLOW_ORIGINS", "").split(",")
    if not allowed_origins or allowed_origins[0] == "":
        allowed_origins = ["*"]  # Allow all origins if none specified

    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["*"]
    )
