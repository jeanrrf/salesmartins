const mysql = require('mysql2');

const getDbConfig = () => {
    // Verifica se está em produção
    if (process.env.NODE_ENV === 'production') {
        return {
            host: process.env.PROD_DB_HOST,
            user: process.env.PROD_DB_USER,
            password: process.env.PROD_DB_PASSWORD,
            database: process.env.PROD_DB_NAME,
            port: parseInt(process.env.PROD_DB_PORT || '51365', 10),
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
            connectTimeout: 10000
        };
    }

    // Configuração de desenvolvimento
    return {
        host: process.env.MYSQL_HOST || 'localhost',
        user: process.env.MYSQL_USER || 'root',
        password: process.env.MYSQL_PASSWORD || '',
        database: process.env.MYSQL_DATABASE || 'shopee_analytics',
        port: parseInt(process.env.MYSQL_PORT || '3306', 10),
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        connectTimeout: 10000
    };
};

const pool = mysql.createPool(getDbConfig());

const connectDB = async () => {
    const config = getDbConfig();
    console.log(`Tentando conectar ao MySQL (${process.env.NODE_ENV || 'development'}):`);
    console.log(`Host: ${config.host}`);
    console.log(`Database: ${config.database}`);
    console.log(`Port: ${config.port}`);

    let retries = 5;
    while (retries) {
        try {
            const connection = pool.promise();
            await connection.query('SELECT 1');
            console.log('✅ MySQL conectado com sucesso');
            return connection;
        } catch (error) {
            console.error('❌ Falha na conexão MySQL:', error.message);
            if (error.code === 'ER_ACCESS_DENIED_ERROR') {
                console.error('Access denied. Verifique as credenciais.');
            } else if (error.code === 'ECONNREFUSED') {
                console.error('Conexão recusada. Verifique se o servidor MySQL está rodando.');
            }
            retries -= 1;
            if (retries > 0) {
                console.log(`Tentando novamente... (${5 - retries}/5)`);
                await new Promise(res => setTimeout(res, 5000));
            }
        }
    }
    throw new Error('Não foi possível conectar ao MySQL após várias tentativas.');
};

// Função para testar a conexão
const testConnection = async () => {
    try {
        await connectDB();
        return true;
    } catch (error) {
        console.error('Erro no teste de conexão:', error);
        return false;
    }
};

module.exports = { connectDB, pool, testConnection };