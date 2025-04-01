import sqlite3

def migrate():
    conn = sqlite3.connect('shopee-analytics.db')
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

    conn.commit()
    conn.close()

if __name__ == "__main__":
    migrate()