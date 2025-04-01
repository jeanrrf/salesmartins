import os
import sys
import sqlite3
import logging
import platform

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Path to the database file
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, 'shopee-analytics.db')
DB_PATH_RENDER = '/opt/render/project/src/shopee-analytics.db'

def check_environment():
    """Check the environment information."""
    logger.info(f"Sistema Operacional: {platform.system()} {platform.release()}")
    logger.info(f"Python: {sys.version}")
    logger.info(f"Diretório atual: {os.getcwd()}")
    logger.info(f"Diretório base: {BASE_DIR}")
    logger.info(f"Caminho do banco de dados local: {DB_PATH}")

def check_file_existence():
    """Check if the database file exists."""
    if os.path.exists(DB_PATH):
        logger.info(f"✅ Banco de dados encontrado em: {DB_PATH}")
        logger.info(f"   Tamanho: {os.path.getsize(DB_PATH)} bytes")
        return True
    else:
        logger.error(f"❌ Banco de dados não encontrado em: {DB_PATH}")
        
        # Check alternative path for Render
        if os.path.exists(DB_PATH_RENDER):
            logger.info(f"✅ Banco de dados encontrado no caminho do Render: {DB_PATH_RENDER}")
            logger.info(f"   Tamanho: {os.path.getsize(DB_PATH_RENDER)} bytes")
            return True
            
        return False

def check_file_permissions():
    """Check if the database file has read/write permissions."""
    try:
        # Check local path
        if os.path.exists(DB_PATH):
            path_to_check = DB_PATH
        # Check Render path
        elif os.path.exists(DB_PATH_RENDER):
            path_to_check = DB_PATH_RENDER
        else:
            logger.error("❌ Nenhum banco de dados encontrado para verificar permissões.")
            return False
            
        if os.access(path_to_check, os.R_OK) and os.access(path_to_check, os.W_OK):
            logger.info("✅ Permissões de leitura e escrita estão corretas.")
            return True
        else:
            logger.error("❌ Permissões de leitura e/ou escrita estão incorretas.")
            if not os.access(path_to_check, os.R_OK):
                logger.error("   Problema: Sem permissão de leitura.")
            if not os.access(path_to_check, os.W_OK):
                logger.error("   Problema: Sem permissão de escrita.")
            return False
    except Exception as e:
        logger.error(f"❌ Erro ao verificar permissões: {str(e)}")
        return False

def test_database_connection():
    """Test connection to the database and list tables."""
    try:
        # Try local path first
        path_to_try = DB_PATH
        
        if not os.path.exists(path_to_try) and os.path.exists(DB_PATH_RENDER):
            path_to_try = DB_PATH_RENDER
            
        logger.info(f"Testando conexão com o banco de dados em: {path_to_try}")
        conn = sqlite3.connect(path_to_try)
        cursor = conn.cursor()

        # List tables in the database
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        logger.info(f"✅ Conexão bem-sucedida! Tabelas encontradas: {tables}")
        
        # Test query on products table if it exists
        if any('products' in table for table in tables):
            cursor.execute("SELECT COUNT(*) FROM products;")
            count = cursor.fetchone()[0]
            logger.info(f"✅ Consulta teste: {count} produtos encontrados no banco.")

        conn.close()
        return True
    except Exception as e:
        logger.error(f"❌ Erro ao conectar com o banco de dados: {str(e)}")
        # Try to diagnose specific SQLite errors
        if "unable to open database file" in str(e):
            logger.error("   Problema: SQLite não consegue abrir o arquivo do banco de dados.")
            logger.error("   Possíveis causas: caminho incorreto, permissões insuficientes, diretório inexistente.")
        return False

def test_sqlalchemy_connection():
    """Test SQLAlchemy connection to the database."""
    try:
        from sqlalchemy import create_engine
        from sqlalchemy.exc import SQLAlchemyError
        
        logger.info("Testando conexão do SQLAlchemy...")
        
        # Try local path first
        path_to_try = f'sqlite:///{DB_PATH}'
        
        if not os.path.exists(DB_PATH) and os.path.exists(DB_PATH_RENDER):
            path_to_try = f'sqlite:///{DB_PATH_RENDER}'
            
        logger.info(f"String de conexão SQLAlchemy: {path_to_try}")
        
        engine = create_engine(path_to_try)
        conn = engine.connect()
        conn.close()
        
        logger.info("✅ Conexão SQLAlchemy bem-sucedida!")
        return True
    except ImportError:
        logger.warning("⚠️ SQLAlchemy não está instalado. Ignorando este teste.")
        return None
    except SQLAlchemyError as e:
        logger.error(f"❌ Erro na conexão SQLAlchemy: {str(e)}")
        return False
    except Exception as e:
        logger.error(f"❌ Erro inesperado: {str(e)}")
        return False

def run_diagnostics():
    """Run all diagnostic checks."""
    logger.info("Iniciando diagnóstico completo do banco de dados...")
    logger.info("-" * 50)
    
    check_environment()
    
    logger.info("-" * 50)
    file_exists = check_file_existence()
    if not file_exists:
        logger.error("❌ Diagnóstico falhou: Banco de dados não encontrado!")
        return
    
    logger.info("-" * 50)
    permissions_ok = check_file_permissions()
    if not permissions_ok:
        logger.error("❌ Diagnóstico falhou: Problemas com permissões!")
    
    logger.info("-" * 50)
    connection_ok = test_database_connection()
    if not connection_ok:
        logger.error("❌ Diagnóstico falhou: Problemas na conexão com SQLite!")
    
    logger.info("-" * 50)
    sqlalchemy_ok = test_sqlalchemy_connection()
    if sqlalchemy_ok is False:  # None means SQLAlchemy not installed
        logger.error("❌ Diagnóstico falhou: Problemas na conexão com SQLAlchemy!")
    
    logger.info("-" * 50)
    if connection_ok and (sqlalchemy_ok in [True, None]):
        logger.info("✅ Diagnóstico concluído com sucesso! O banco de dados está acessível.")
    else:
        logger.error("❌ Diagnóstico falhou. Revise os logs para identificar os problemas.")

if __name__ == "__main__":
    run_diagnostics()