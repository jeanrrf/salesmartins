from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

def setup_cors_for_app(app: FastAPI):
    """Configure CORS for a FastAPI application"""
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Allow all origins in development
        allow_credentials=True,
        allow_methods=["*"],  # Allow all methods
        allow_headers=["*"],  # Allow all headers
    )
    
    return app

def setup_static_files(app: FastAPI, directory: str, mount_path: str = "/mock_data"):
    """Mount a directory with static files with CORS support"""
    app.mount(mount_path, StaticFiles(directory=directory), name="mock_data")
    
    return app
