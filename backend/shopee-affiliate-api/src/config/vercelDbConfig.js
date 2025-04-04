/**
 * Configuração de conexão com MySQL para ambiente Vercel
 * Este arquivo lida com as diferentes formas de configuração do banco de dados
 */

const mysql = require('mysql2');

// Configurações do banco de dados
const getDbConfig = () => {
  // Se há uma URL completa de conexão (como em PlanetScale, Railway, etc)
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  // Caso contrário, montar a configuração a partir de variáveis individuais
  return {
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
  };
};

// Função para criar pool de conexões
const createDbPool = () => {
  const config = getDbConfig();

  // Se for string, é uma URL de conexão completa
  if (typeof config === 'string') {
    return mysql.createPool(config);
  }

  // Caso contrário, é um objeto de configuração
  return mysql.createPool(config);
};

// Verificar conexão com o banco
const testConnection = async () => {
  const pool = createDbPool();

  try {
    const connection = await pool.promise().getConnection();
    console.log('✅ Conexão com banco de dados MySQL estabelecida com sucesso');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Erro ao conectar ao banco de dados MySQL:', error);
    return false;
  }
};

module.exports = {
  createDbPool,
  testConnection
};
