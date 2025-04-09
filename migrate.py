import sqlite3

def migrate():
    conn = sqlite3.connect('shopee_affiliate.db')
    cursor = conn.cursor()

    # Adicionar a coluna `product_link` se ela não existir
    try:
        cursor.execute("ALTER TABLE products ADD COLUMN product_link TEXT")
        print("Coluna `product_link` adicionada com sucesso.")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print("A coluna `product_link` já existe.")
        else:
            raise

    # Adicionar a coluna `period_start_time` se ela não existir
    try:
        cursor.execute("ALTER TABLE products ADD COLUMN period_start_time DATETIME")
        print("Coluna `period_start_time` adicionada com sucesso.")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print("A coluna `period_start_time` já existe.")
        else:
            raise

    # Adicionar a coluna `period_end_time` se ela não existir
    try:
        cursor.execute("ALTER TABLE products ADD COLUMN period_end_time DATETIME")
        print("Coluna `period_end_time` adicionada com sucesso.")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print("A coluna `period_end_time` já existe.")
        else:
            raise

    # Adicionar a coluna `short_link` se ela não existir
    try:
        cursor.execute("ALTER TABLE products ADD COLUMN short_link TEXT")
        print("Coluna `short_link` adicionada com sucesso.")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print("A coluna `short_link` já existe.")
        else:
            raise

    # Adicionar a coluna `sub_ids` se ela não existir
    try:
        cursor.execute("ALTER TABLE products ADD COLUMN sub_ids TEXT")
        print("Coluna `sub_ids` adicionada com sucesso.")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print("A coluna `sub_ids` já existe.")
        else:
            raise

    # Fix date format issues in existing data
    try:
        # Set NULL for any invalid date formats
        cursor.execute("UPDATE products SET period_start_time = NULL WHERE period_start_time != '' AND period_start_time IS NOT NULL AND typeof(period_start_time) != 'text'")
        cursor.execute("UPDATE products SET period_end_time = NULL WHERE period_end_time != '' AND period_end_time IS NOT NULL AND typeof(period_end_time) != 'text'")
        cursor.execute("UPDATE products SET created_at = NULL WHERE created_at != '' AND created_at IS NOT NULL AND typeof(created_at) != 'text'")
        cursor.execute("UPDATE products SET updated_at = NULL WHERE updated_at != '' AND updated_at IS NOT NULL AND typeof(updated_at) != 'text'")
        
        print("Formatos de data corrigidos no banco de dados.")
    except sqlite3.OperationalError as e:
        print(f"Erro ao corrigir formatos de data: {str(e)}")

    conn.commit()
    conn.close()

if __name__ == "__main__":
    migrate()