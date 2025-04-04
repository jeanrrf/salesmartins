const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function initializeDatabase() {
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Usar configurações apropriadas baseadas no ambiente
  const config = {
    host: isProduction ? process.env.PROD_DB_HOST : (process.env.MYSQL_HOST || 'localhost'),
    user: isProduction ? process.env.PROD_DB_USER : (process.env.MYSQL_USER || 'root'),
    password: isProduction ? process.env.PROD_DB_PASSWORD : (process.env.MYSQL_PASSWORD || ''),
    port: isProduction ? 
      parseInt(process.env.PROD_DB_PORT || '51365', 10) : 
      parseInt(process.env.MYSQL_PORT || '3306', 10)
  };

  const dbName = isProduction ? process.env.PROD_DB_NAME : (process.env.MYSQL_DATABASE || 'shopee_analytics');

  console.log(`Inicializando banco de dados (${process.env.NODE_ENV || 'development'})...`);
  console.log(`Host: ${config.host}`);
  console.log(`Database: ${dbName}`);

  const connection = await mysql.createConnection(config);

  try {
    // Criar o banco de dados se não existir
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
    console.log(`✅ Banco de dados ${dbName} criado ou já existe.`);

    // Usar o banco de dados
    await connection.query(`USE ${dbName}`);

    // Executar o script SQL
    const sqlFilePath = path.join(__dirname, 'setup.sql');
    const sqlScript = fs.readFileSync(sqlFilePath, 'utf-8');
    
    // Dividir o script em comandos individuais
    const commands = sqlScript.split(';').filter(cmd => cmd.trim());
    
    // Executar cada comando
    for (const command of commands) {
      if (command.trim()) {
        await connection.query(command);
      }
    }
    
    console.log('✅ Tabelas criadas ou já existem.');
    console.log('✅ Inicialização do banco de dados concluída com sucesso!');
  } catch (error) {
    console.error('❌ Erro durante a inicialização do banco de dados:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

// Executar se este arquivo for chamado diretamente (não importado)
if (require.main === module) {
  initializeDatabase()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('❌ Falha na inicialização do banco de dados:', err);
      process.exit(1);
    });
}

module.exports = initializeDatabase;