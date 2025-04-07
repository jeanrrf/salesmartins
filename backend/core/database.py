from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.core.config import DB_PATH
from backend.models import Base
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configurar o engine do SQLAlchemy
engine = create_engine(
    f"sqlite:///{DB_PATH}",
    connect_args={"check_same_thread": False}
)

# Criar uma sessão local
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    """Inicializa o banco de dados e cria as tabelas."""
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("✅ Banco de dados inicializado com sucesso.")
    except Exception as e:
        logger.error(f"❌ Erro ao inicializar o banco de dados: {e}")

def get_db():
    """Cria e retorna uma sessão de banco de dados."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
