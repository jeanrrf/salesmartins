#!/usr/bin/env bash
# exit on error
set -o errexit

# Deactivate virtual environment if active
if [ -n "$VIRTUAL_ENV" ]; then
    deactivate
fi

# Upgrade pip
python -m pip install --upgrade pip

# Install Python dependencies
pip install --no-cache-dir -r $(dirname "$0")/requirements.txt

# Ensure database directories exist
mkdir -p /opt/render/project/src
mkdir -p /data

# Move the populated database to both locations for backward compatibility
cp $(dirname "$0")/shopee-analytics.db /opt/render/project/src/shopee-analytics.db
cp $(dirname "$0")/shopee-analytics.db /data/shopee-analytics.db

# Ensure appropriate permissions
chmod 666 /data/shopee-analytics.db
chmod 666 /opt/render/project/src/shopee-analytics.db

# Log to verify if the database was copied successfully
echo "Verificando se o banco de dados foi copiado (diretório persistente):"
ls -l /data/shopee-analytics.db
echo "Verificando se o banco de dados foi copiado (diretório de projeto):"
ls -l /opt/render/project/src/shopee-analytics.db

# Create database if it doesn't exist
python << END
import sqlite3
import os

# Verificar e criar conexões para ambos os caminhos
paths = ['/data/shopee-analytics.db', '/opt/render/project/src/shopee-analytics.db']

for db_path in paths:
    if not os.path.exists(db_path):
        print(f"Criando banco de dados em: {db_path}")
        conn = sqlite3.connect(db_path)
        conn.close()
    else:
        print(f"Banco de dados já existe em: {db_path}")
END

# Make sure the frontend directory exists and has proper permissions
mkdir -p frontend/static
chmod -R 755 frontend/