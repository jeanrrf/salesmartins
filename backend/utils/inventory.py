# ###################################################################################################
# Arquivo: inventory.py                                                                            #
# Descrição: Utilitário para verificar itens já existentes no estoque/banco de dados                #
# Autor: Jean Rosso                                                                                 #
# Data: 8 de abril de 2025                                                                          #
# ###################################################################################################

import os
import json
import sqlite3
import logging
from typing import List, Dict, Any

# Configure logger
logger = logging.getLogger(__name__)

def get_inventory_items() -> List[Dict[str, Any]]:
    """
    Obtém lista de produtos já existentes no estoque/banco de dados
    
    Returns:
        Lista de itens no estoque com seus IDs
    """
    try:
        # Primeiro tenta buscar do banco de dados SQLite
        items = get_items_from_database()
        if items:
            return items
            
        # Se não encontrar no banco, tenta ler do arquivo JSON
        return get_items_from_json()
    except Exception as e:
        logger.error(f"Error retrieving inventory items: {str(e)}")
        return []

def get_items_from_database() -> List[Dict[str, Any]]:
    """
    Busca itens do banco de dados SQLite
    
    Returns:
        Lista de itens do banco
    """
    try:
        # Path para o arquivo de banco de dados
        db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "shopee-analytics.db")
        
        if not os.path.exists(db_path):
            logger.info(f"Database file not found: {db_path}")
            return []
        
        # Conecta ao banco de dados
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Busca produtos da tabela
        cursor.execute("SELECT id, item_id as externalId, name FROM products")
        rows = cursor.fetchall()
        
        # Converte para lista de dicionários
        items = [{
            "id": row["externalId"] or row["id"],
            "name": row["name"]
        } for row in rows]
        
        conn.close()
        
        logger.info(f"Found {len(items)} items in database")
        return items
        
    except Exception as e:
        logger.error(f"Error reading from database: {str(e)}")
        return []

def get_items_from_json() -> List[Dict[str, Any]]:
    """
    Busca itens do arquivo JSON de estoque
    
    Returns:
        Lista de itens do arquivo JSON
    """
    try:
        # Path para o arquivo JSON de estoque
        json_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "inventory.json")
        
        if not os.path.exists(json_path):
            logger.info(f"Inventory JSON file not found: {json_path}")
            return []
        
        # Lê o arquivo JSON
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        if isinstance(data, dict) and "items" in data:
            items = data["items"]
        elif isinstance(data, list):
            items = data
        else:
            logger.warning("Invalid inventory JSON format")
            return []
            
        logger.info(f"Found {len(items)} items in JSON inventory")
        return items
            
    except Exception as e:
        logger.error(f"Error reading inventory JSON: {str(e)}")
        return []
