import sys
import os

# Adicionar o diretório raiz ao path para permitir importações relativas
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Importar a aplicação do backend
from backend.api import app

# Exportar a aplicação para a Vercel
# Isso depende de qual framework você está usando (FastAPI ou Flask)

# Se estiver usando FastAPI:
from fastapi import FastAPI
app_instance = app

# Se estiver usando Flask:
# from flask import Flask
# app_instance = app