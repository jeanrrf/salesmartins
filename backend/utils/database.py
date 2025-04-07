# ###################################################################################################
# Arquivo: database.py                                                                          #
# Descrição: Este script contém funções utilitárias para interagir com o banco de dados.          #
# Autor: Jean Rosso                                                                              #
# Data: 28 de março de 2025                                                                      #
# ###################################################################################################

"""
Database utility module.

This module contains functions for creating and managing database sessions.
"""
from sqlalchemy.orm import sessionmaker
from backend.models import Base, engine
import logging

# Configuração de logging
logger = logging.getLogger(__name__)

# Criar uma sessão local para interagir com o banco de dados
SessionLocal = sessionmaker(bind=engine)

def get_db():
    """Generator para obter uma sessão do banco de dados."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()