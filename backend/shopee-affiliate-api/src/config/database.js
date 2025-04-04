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
    let retries = 5;
    while (retries) {
        try {
            const connection = pool.promise();
            await connection.query('SELECT 1');
            console.log('MySQL conectado com sucesso');
            return connection;
        } catch (error) {
            console.error('Falha na conexão MySQL:', error.message);
            retries -= 1;
            console.log(`Tentando novamente... (${5 - retries}/5)`);
            await new Promise(res => setTimeout(res, 5000));
        }
    }
    throw new Error('Não foi possível conectar ao MySQL após várias tentativas.');
};

module.exports = { connectDB, pool };