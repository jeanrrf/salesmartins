/**
 * Script de inicialização para deploy na Vercel
 * Este script executa tarefas essenciais para configurar o ambiente
 */

require('dotenv').config();
const { connectDB } = require('./src/config/database');
const { testConnection } = require('./src/config/vercelDbConfig');
const bcrypt = require('bcryptjs');
const fs = require('fs').promises;
const path = require('path');

async function initializeVercelEnvironment() {
  console.log('🚀 Inicializando ambiente para deploy na Vercel...');

  // 1. Testar conexão com o banco de dados
  console.log('1️⃣ Verificando conexão com o banco de dados...');
  const dbConnected = await testConnection();
  
  if (!dbConnected) {
    console.error('❌ ERRO CRÍTICO: Não foi possível conectar ao banco de dados.');
    console.error('⚠️ Verifique as variáveis de ambiente de conexão com o banco.');
    return false;
  }

  // 2. Verificar se as tabelas existem, caso contrário criar
  console.log('2️⃣ Verificando estrutura do banco de dados...');
  try {
    const connection = await connectDB();
    
    // Ler o arquivo SQL
    const sqlPath = path.join(__dirname, 'src/config/setup.sql');
    const sqlContent = await fs.readFile(sqlPath, 'utf8');
    
    // Dividir o arquivo em comandos individuais
    const sqlCommands = sqlContent
      .split(';')
      .filter(cmd => cmd.trim() !== '')
      .map(cmd => cmd + ';');
    
    // Executar cada comando
    for (const command of sqlCommands) {
      await connection.query(command);
    }
    
    console.log('✅ Banco de dados estruturado com sucesso');
  } catch (error) {
    console.error('❌ Erro ao estruturar banco de dados:', error);
    return false;
  }

  // 3. Verificar se existe usuário admin, caso não, criar
  console.log('3️⃣ Verificando usuário administrador...');
  try {
    const connection = await connectDB();
    
    // Verificar se a tabela users tem a coluna name
    const [columnsResult] = await connection.query('SHOW COLUMNS FROM users');
    const columns = columnsResult.map(col => col.Field);
    const hasNameColumn = columns.includes('name');
    
    // Verificar se admin existe
    const [rows] = await connection.query(
      'SELECT * FROM users WHERE username = ? AND role = "admin"', 
      [process.env.ADMIN_USERNAME || 'admin']
    );
    
    if (rows.length === 0) {
      // Admin não existe, criar
      const adminUsername = process.env.ADMIN_USERNAME || 'admin';
      const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
      
      // Hash da senha
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      
      // Inserir o admin com ou sem o campo name dependendo da estrutura da tabela
      if (hasNameColumn) {
        const adminName = process.env.ADMIN_NAME || 'Administrator';
        await connection.query(
          'INSERT INTO users (username, email, password, name, role, created_at) VALUES (?, ?, ?, ?, "admin", NOW())',
          [adminUsername, adminEmail, hashedPassword, adminName]
        );
      } else {
        await connection.query(
          'INSERT INTO users (username, email, password, role, created_at) VALUES (?, ?, ?, "admin", NOW())',
          [adminUsername, adminEmail, hashedPassword]
        );
      }
      
      console.log('✅ Usuário administrador criado com sucesso');
    } else {
      console.log('✅ Usuário administrador já existe');
    }
  } catch (error) {
    console.error('❌ Erro ao verificar/criar usuário admin:', error);
    return false;
  }
  
  console.log('✅ Ambiente inicializado com sucesso para deploy na Vercel!');
  return true;
}

// Executar apenas se chamado diretamente (não em require)
if (require.main === module) {
  initializeVercelEnvironment().then(success => {
    if (!success) {
      process.exit(1);
    }
  });
}

module.exports = { initializeVercelEnvironment };
