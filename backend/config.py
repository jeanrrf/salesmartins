"""Configurações centralizadas do backend"""

import os
from pathlib import Path

# Validar ambiente
ENVIRONMENT = os.getenv('ENVIRONMENT', 'development')
if ENVIRONMENT not in ['development', 'production', 'testing']:
    raise ValueError(f"Ambiente inválido: {ENVIRONMENT}")

# Paths
BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR / "data"
LOG_DIR = BASE_DIR / "logs"

# Ensure directories exist
DATA_DIR.mkdir(exist_ok=True)
LOG_DIR.mkdir(exist_ok=True)

# CORS Settings
CORS_ORIGINS = os.getenv('CORS_ALLOW_ORIGINS', 'http://localhost:8000,http://localhost:3000').split(',')
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_METHODS = ["*"]
CORS_ALLOW_HEADERS = ["*"]

# Database
DB_PATH = os.getenv('DB_PATH', str(DATA_DIR / "shopee-analytics.db"))
DB_URL = f"sqlite:///{DB_PATH}"
DB_BACKUP_ENABLED = os.getenv('DB_BACKUP_ENABLED', 'true').lower() == 'true'
DB_BACKUP_INTERVAL = int(os.getenv('DB_BACKUP_INTERVAL', '3600'))

# API Settings
API_VERSION = os.getenv('API_VERSION', '1.0.0')
API_RATE_LIMIT = int(os.getenv('API_RATE_LIMIT', '100'))
API_TIMEOUT = int(os.getenv('API_TIMEOUT', '30000'))

# Cache Settings
CACHE_ENABLED = os.getenv('CACHE_ENABLED', 'true').lower() == 'true'
CACHE_TTL = int(os.getenv('CACHE_TTL', '300'))
CACHE_MAX_SIZE = int(os.getenv('CACHE_MAX_SIZE', '1000'))

# Environment specific settings
if ENVIRONMENT == 'production':
    DEBUG = False
    CACHE_TIMEOUT = 600  # 10 minutes
else:
    DEBUG = os.getenv('DEBUG', 'true').lower() == 'true'
    CACHE_TIMEOUT = 300  # 5 minutes

# Logging Settings
LOG_LEVEL = os.getenv('LOG_LEVEL', 'debug').upper()
LOG_FORMAT = os.getenv('LOG_FORMAT', 'detailed')
LOG_MAX_SIZE = os.getenv('LOG_MAX_SIZE', '10m')
LOG_MAX_FILES = int(os.getenv('LOG_MAX_FILES', '7'))
LOG_ROTATION_INTERVAL = os.getenv('LOG_ROTATION_INTERVAL', '1d')