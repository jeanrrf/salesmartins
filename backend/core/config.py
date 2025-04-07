import os
from pathlib import Path

# Diretórios
BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR / "data"
LOG_DIR = BASE_DIR / "logs"

# Garantir que os diretórios existam
DATA_DIR.mkdir(exist_ok=True)
LOG_DIR.mkdir(exist_ok=True)

# Configurações gerais
DB_PATH = str(DATA_DIR / "shopee-analytics.db")
DEBUG = True
