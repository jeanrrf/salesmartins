from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

# Import models to ensure they are registered with Base
from backend.models.product import Product  # noqa: F401