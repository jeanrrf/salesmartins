from sqlalchemy import Column, Integer, String, Float
from backend.core.database import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    price = Column(Float)
    description = Column(String, nullable=True)

    def __repr__(self):
        return f"<Product(id={self.id}, name={self.name}, price={self.price})>"
