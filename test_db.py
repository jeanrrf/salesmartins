from backend.utils.database import test_connection
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)

if __name__ == "__main__":
    is_connected = test_connection()
    if is_connected:
        print("✅ Conexão com o banco de dados estabelecida com sucesso!")
    else:
        print("❌ Falha ao conectar com o banco de dados!")