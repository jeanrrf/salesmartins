# ###################################################################################################
# Arquivo: models.py                                                                            #
# Descrição: Este script define os modelos de banco de dados usando SQLAlchemy.                   #
# Autor: Jean Rosso                                                                              #
# Data: 28 de março de 2025                                                                      #
# ###################################################################################################

from sqlalchemy import Column, Integer, String, Float, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

Base = declarative_base()

class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    price = Column(Float, nullable=False)

engine = create_engine("sqlite:///./data/shopee-analytics.db", connect_args={"check_same_thread": False})
Base.metadata.create_all(engine)