import os
import sys
import logging
import sqlite3
import shutil
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, JSON, create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Criar base de modelo declarativo
Base = declarative_base()

# Definir caminho do banco de dados
if os.environ.get('RENDER') == "1":
    # No ambiente Render, usamos um banco de dados em memória para evitar problemas de acesso ao disco
    logger.info("🔄 Ambiente Render detectado: Usando banco de dados em memória")
    DB_PATH = ":memory:"  # SQLite in-memory database
    engine = create_engine(f'sqlite:///{DB_PATH}?cache=shared', 
                          connect_args={'check_same_thread': False})
    
    # Função para carregar dados do disco para a memória
    def load_data_from_disk():
        try:
            # Tente ambos os caminhos possíveis
            disk_paths = ["/data/shopee-analytics.db", 
                         "/opt/render/project/src/shopee-analytics.db"]
            
            for disk_path in disk_paths:
                if os.path.exists(disk_path):
                    logger.info(f"✅ Encontrado banco de dados em disco: {disk_path}")
                    
                    # Conectar ao banco de dados em memória
                    memory_conn = engine.raw_connection().connection
                    
                    # Carregar o banco de dados do disco para a memória
                    logger.info(f"🔄 Carregando dados do disco para a memória...")
                    disk_conn = sqlite3.connect(disk_path)
                    query = "".join(line for line in disk_conn.iterdump())
                    memory_conn.executescript(query)
                    disk_conn.close()
                    
                    logger.info(f"✅ Dados carregados com sucesso do arquivo {disk_path} para a memória")
                    return True
            
            logger.warning("⚠️ Nenhum arquivo de banco de dados encontrado no disco")
            return False
        except Exception as e:
            logger.error(f"❌ Erro ao carregar dados do disco para a memória: {str(e)}")
            return False
else:
    # Em ambiente de desenvolvimento, usar arquivo normal
    logger.info("🔄 Ambiente de desenvolvimento: Usando arquivo de banco de dados padrão")
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    DB_PATH = os.path.join(os.path.dirname(BASE_DIR), "shopee-analytics.db")
    engine = create_engine(f'sqlite:///{DB_PATH}')

# Definir modelo Product
class Product(Base):
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    shopee_id = Column(String(255), nullable=False, unique=True)
    name = Column(String(255), nullable=False)
    price = Column(Float, nullable=False)
    original_price = Column(Float, nullable=True)
    category_id = Column(Integer, nullable=True)
    shop_id = Column(Integer, nullable=True)
    stock = Column(Integer, nullable=True)
    commission_rate = Column(Float, nullable=True)
    sales = Column(Integer, nullable=True)
    image_url = Column(String(1024), nullable=True)
    shop_name = Column(String(255), nullable=True)
    offer_link = Column(String(2048), nullable=True)
    short_link = Column(String(1024), nullable=True)
    rating_star = Column(Float, nullable=True)
    price_discount_rate = Column(Float, nullable=True)
    sub_ids = Column(String(1024), nullable=True, default="[]")
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Campos adicionais desde a última atualização
    item_status = Column(String(255), nullable=True)
    discount = Column(String(255), nullable=True)
    product_link = Column(String(2048), nullable=True)
    period_start_time = Column(String(255), nullable=True)
    period_end_time = Column(String(255), nullable=True)
    shop_type = Column(String(255), nullable=True)
    seller_commission_rate = Column(Float, nullable=True)
    shopee_commission_rate = Column(Float, nullable=True)
    affiliate_link = Column(String(2048), nullable=True)
    product_metadata = Column(JSON, nullable=True)
    
    def __repr__(self):
        return f"<Product(id={self.id}, name='{self.name}', price={self.price})>"

# Criar todas as tabelas no banco de dados
logger.info(f"🔄 Criando tabelas no banco de dados...")
Base.metadata.create_all(engine)

# Se estivermos no Render, carregar dados do disco para a memória
if os.environ.get('RENDER') == "1":
    load_data_from_disk()

# Criar uma sessão local para interagir com o banco de dados
SessionLocal = sessionmaker(bind=engine)

# Função para salvar o banco de dados em memória para o disco (útil para persistir dados)
def save_memory_db_to_disk():
    if os.environ.get('RENDER') == "1" and DB_PATH == ":memory:":
        try:
            memory_conn = engine.raw_connection().connection
            
            # Salvar em ambos os caminhos possíveis para garantir
            disk_paths = ["/data/shopee-analytics.db", 
                         "/opt/render/project/src/shopee-analytics.db"]
            
            for disk_path in disk_paths:
                try:
                    # Ensure directory exists
                    os.makedirs(os.path.dirname(disk_path), exist_ok=True)
                    
                    # Create backup if file exists
                    if os.path.exists(disk_path):
                        backup_path = f"{disk_path}.backup"
                        shutil.copy2(disk_path, backup_path)
                    
                    # Save in-memory database to disk
                    disk_conn = sqlite3.connect(disk_path)
                    query = "".join(line for line in memory_conn.iterdump())
                    disk_conn.executescript(query)
                    disk_conn.commit()
                    disk_conn.close()
                    logger.info(f"✅ Banco de dados em memória salvo com sucesso em {disk_path}")
                except Exception as e:
                    logger.error(f"❌ Erro ao salvar banco de dados em {disk_path}: {str(e)}")
        except Exception as e:
            logger.error(f"❌ Erro ao salvar banco de dados em memória para o disco: {str(e)}")

# Registrar evento para salvar banco de dados em memória para o disco periodicamente
@event.listens_for(engine, "before_cursor_execute")
def save_db_periodically(conn, cursor, statement, parameters, context, executemany):
    if os.environ.get('RENDER') == "1" and DB_PATH == ":memory:":
        # A cada 100 operações, salvar o banco de dados
        global operation_count
        operation_count = getattr(conn, '_operation_count', 0) + 1
        conn._operation_count = operation_count
        
        if operation_count % 100 == 0:
            save_memory_db_to_disk()