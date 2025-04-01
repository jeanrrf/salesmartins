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
DB_PATH_RENDER_SRC = '/opt/render/project/src/shopee-analytics.db'
DB_PATH_RENDER_DATA = '/data/shopee-analytics.db'

def check_environment():
    """Check the environment information."""
    logger.info(f"Sistema Operacional: {platform.system()} {platform.release()}")
    logger.info(f"Python: {sys.version}")
    logger.info(f"Diretório atual: {os.getcwd()}")
    logger.info(f"Diretório base: {BASE_DIR}")
    logger.info(f"Caminho do banco de dados local: {DB_PATH}")
    logger.info(f"Caminho do banco de dados no Render (src): {DB_PATH_RENDER_SRC}")
    logger.info(f"Caminho do banco de dados no Render (data): {DB_PATH_RENDER_DATA}")

def check_file_existence():
    """Check if the database file exists."""
    if os.path.exists(DB_PATH):
        logger.info(f"✅ Banco de dados encontrado em: {DB_PATH}")
        logger.info(f"   Tamanho: {os.path.getsize(DB_PATH)} bytes")
        return True
    else:
        logger.warning(f"⚠️ Banco de dados não encontrado em: {DB_PATH}")
        
        # Check alternative paths for Render
        if os.path.exists(DB_PATH_RENDER_SRC):
            logger.info(f"✅ Banco de dados encontrado no caminho do Render (src): {DB_PATH_RENDER_SRC}")
            logger.info(f"   Tamanho: {os.path.getsize(DB_PATH_RENDER_SRC)} bytes")
            return True
        elif os.path.exists(DB_PATH_RENDER_DATA):
            logger.info(f"✅ Banco de dados encontrado no caminho do Render (data): {DB_PATH_RENDER_DATA}")
            logger.info(f"   Tamanho: {os.path.getsize(DB_PATH_RENDER_DATA)} bytes")
            return True
            
        logger.error("❌ Banco de dados não encontrado em nenhum dos caminhos verificados.")
        return False

def check_file_permissions():
    """Check if the database file has read/write permissions."""
    try:
        # Check all possible paths
        paths_to_check = []
        
        if os.path.exists(DB_PATH):
            paths_to_check.append(("Local", DB_PATH))
        if os.path.exists(DB_PATH_RENDER_SRC):
            paths_to_check.append(("Render (src)", DB_PATH_RENDER_SRC))
        if os.path.exists(DB_PATH_RENDER_DATA):
            paths_to_check.append(("Render (data)", DB_PATH_RENDER_DATA))
            
        if not paths_to_check:
            logger.error("❌ Nenhum banco de dados encontrado para verificar permissões.")
            return False
        
        all_ok = True
        for desc, path in paths_to_check:
            if os.access(path, os.R_OK) and os.access(path, os.W_OK):
                logger.info(f"✅ {desc}: Permissões de leitura e escrita estão corretas em {path}.")
            else:
                logger.error(f"❌ {desc}: Permissões de leitura e/ou escrita estão incorretas em {path}.")
                if not os.access(path, os.R_OK):
                    logger.error(f"   Problema: Sem permissão de leitura em {path}.")
                if not os.access(path, os.W_OK):
                    logger.error(f"   Problema: Sem permissão de escrita em {path}.")
                all_ok = False
                
        return all_ok
    except Exception as e:
        logger.error(f"❌ Erro ao verificar permissões: {str(e)}")
        return False

def test_database_connection():
    """Test connection to the database and list tables."""
    paths_to_try = [
        ("Local", DB_PATH),
        ("Render (src)", DB_PATH_RENDER_SRC),
        ("Render (data)", DB_PATH_RENDER_DATA)
    ]
    
    # Filter to only existing paths
    existing_paths = [(desc, path) for desc, path in paths_to_try if os.path.exists(path)]
    
    if not existing_paths:
        logger.error("❌ Nenhum banco de dados encontrado para testar conexão.")
        return False
    
    success = False
    
    for desc, path in existing_paths:
        try:
            logger.info(f"Testando conexão com o banco de dados em: {path} ({desc})")
            conn = sqlite3.connect(path)
            cursor = conn.cursor()

            # List tables in the database
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
            tables = cursor.fetchall()
            logger.info(f"✅ Conexão bem-sucedida a {desc}! Tabelas encontradas: {tables}")
            
            # Test query on products table if it exists
            if any('products' in table[0] for table in tables):
                cursor.execute("SELECT COUNT(*) FROM products;")
                count = cursor.fetchone()[0]
                logger.info(f"✅ Consulta teste: {count} produtos encontrados no banco.")

            conn.close()
            success = True
        except Exception as e:
            logger.error(f"❌ Erro ao conectar com o banco de dados em {path} ({desc}): {str(e)}")
            # Try to diagnose specific SQLite errors
            if "unable to open database file" in str(e):
                logger.error(f"   Problema: SQLite não consegue abrir o arquivo do banco de dados em {path}.")
                logger.error("   Possíveis causas: caminho incorreto, permissões insuficientes, diretório inexistente.")
    
    return success

def test_sqlalchemy_connection():
    """Test SQLAlchemy connection to the database."""
    try:
        from sqlalchemy import create_engine
        from sqlalchemy.exc import SQLAlchemyError
        
        logger.info("Testando conexão do SQLAlchemy...")
        
        # Define paths para testar
        paths_to_try = [
            ("Local", f'sqlite:///{DB_PATH}'),
            ("Render (src)", f'sqlite:///{DB_PATH_RENDER_SRC}'),
            ("Render (data)", f'sqlite:///{DB_PATH_RENDER_DATA}')
        ]
        
        # Filtra apenas os caminhos de arquivos que existem
        existing_paths = [(desc, path) for desc, path in paths_to_try 
                         if os.path.exists(path.replace('sqlite:///', ''))]
        
        if not existing_paths:
            logger.error("❌ Nenhum banco de dados encontrado para testar com SQLAlchemy.")
            return False
        
        success = False
        
        for desc, path in existing_paths:
            try:
                logger.info(f"Testando SQLAlchemy com {desc}: {path}")
                engine = create_engine(path)
                conn = engine.connect()
                conn.close()
                logger.info(f"✅ Conexão SQLAlchemy bem-sucedida com {desc}!")
                success = True
            except SQLAlchemyError as e:
                logger.error(f"❌ Erro na conexão SQLAlchemy com {desc}: {str(e)}")
        
        return success
    except ImportError:
        logger.warning("⚠️ SQLAlchemy não está instalado. Ignorando este teste.")
        return None
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