const mysql = require('mysql2');

const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'shopee_analytics',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const connectDB = async () => {
    try {
        const connection = pool.promise();
        await connection.query('SELECT 1');
        console.log('MySQL conectado com sucesso');
        return connection;
    } catch (error) {
        console.error('Falha na conexão MySQL:', error.message);
        throw error;
    }
};

module.exports = { connectDB, pool };