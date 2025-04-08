from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

def setup_cors_for_app(app: FastAPI):
    """Configure CORS for a FastAPI application"""
    origins = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "*"  # For development only - remove in production
    ]
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],  # Allow all methods
        allow_headers=["*"],  # Allow all headers
    )
    
    print(f"CORS middleware configured with origins: {origins}")
    return app

def setup_static_files(app: FastAPI, directory: str, mount_path: str = "/mock_data"):
    """Mount a directory with static files with CORS support"""
    if not os.path.exists(directory):
        os.makedirs(directory, exist_ok=True)
        print(f"Created directory: {directory}")
        
    app.mount(mount_path, StaticFiles(directory=directory), name="mock_data")
    print(f"Static files mounted at {mount_path} from {directory}")
    
    return app
