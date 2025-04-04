const mysql = require('mysql2');

const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    port: parseInt(process.env.MYSQL_PORT, 10),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 10000
});

const connectDB = async () => {
    console.log('Attempting to connect to MySQL with config:', {
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER,
        database: process.env.MYSQL_DATABASE,
        port: parseInt(process.env.MYSQL_PORT, 10)
    });

    let retries = 5;
    while (retries) {
        try {
            const connection = pool.promise();
            await connection.query('SELECT 1');
            console.log('MySQL conectado com sucesso');
            
            // Verify products table exists and has correct structure
            try {
                const [tables] = await connection.query('SHOW TABLES LIKE "products"');
                if (tables.length === 0) {
                    console.error('Products table not found in database');
                    throw new Error('Products table not found');
                }
                
                const [columns] = await connection.query('SHOW COLUMNS FROM products');
                console.log('Products table structure:', columns.map(c => c.Field));
            } catch (tableError) {
                console.error('Error checking products table:', tableError);
                throw tableError;
            }
            
            return connection;
        } catch (error) {
            console.error('Falha na conexão MySQL:', error.message);
            if (error.code === 'ER_ACCESS_DENIED_ERROR') {
                console.error('Access denied. Please check credentials.');
            } else if (error.code === 'ECONNREFUSED') {
                console.error('Connection refused. Please check if MySQL server is running.');
            }
            retries -= 1;
            console.log(`Tentando novamente... (${5 - retries}/5)`);
            await new Promise(res => setTimeout(res, 5000));
        }
    }
    throw new Error('Não foi possível conectar ao MySQL após várias tentativas.');
};

module.exports = { connectDB, pool };