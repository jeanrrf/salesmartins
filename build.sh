#!/usr/bin/env bash
# exit on error
set -o errexit

# Upgrade pip
python -m pip install --upgrade pip

# Install Python dependencies
pip install --no-cache-dir -r $(dirname "$0")/requirements.txt

# Ensure the database directory exists
mkdir -p /opt/render/project/src

# Move the populated database to the correct location
cp $(dirname "$0")/shopee-analytics.db /opt/render/project/src/shopee-analytics.db

# Create database if it doesn't exist
python << END
import sqlite3
conn = sqlite3.connect('/opt/render/project/src/shopee-analytics.db')
conn.close()
END

# Make sure the frontend directory exists and has proper permissions
mkdir -p frontend/static
chmod -R 755 frontend/