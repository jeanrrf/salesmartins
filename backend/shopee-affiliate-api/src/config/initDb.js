const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function initializeDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || ''
  });

  try {
    // Criar o banco de dados se não existir
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.MYSQL_DATABASE || 'shopee_analytics'}`);
    console.log(`Banco de dados ${process.env.MYSQL_DATABASE || 'shopee_analytics'} criado ou já existe.`);

    // Usar o banco de dados
    await connection.query(`USE ${process.env.MYSQL_DATABASE || 'shopee_analytics'}`);

    // Executar o script SQL
    const sqlFilePath = path.join(__dirname, 'setup.sql');
    const sqlScript = fs.readFileSync(sqlFilePath, 'utf-8');
    
    // Dividir o script em comandos individuais
    const commands = sqlScript.split(';').filter(cmd => cmd.trim());
    
    for (const command of commands) {
      if (command.trim()) {
        await connection.query(command);
      }
    }
    
    console.log('Tabelas criadas ou já existem.');
    console.log('Inicialização do banco de dados concluída com sucesso!');
  } catch (error) {
    console.error('Erro durante a inicialização do banco de dados:', error);
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
      console.error('Falha na inicialização do banco de dados:', err);
      process.exit(1);
    });
}

module.exports = initializeDatabase;