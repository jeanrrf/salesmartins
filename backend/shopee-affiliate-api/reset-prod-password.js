require('dotenv').config();
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

async function resetAdminPassword() {
  let connection;
  try {
    // Configuração específica para produção usando as credenciais corretas do Railway
    connection = await mysql.createConnection({
      host: 'shortline.proxy.rlwy.net',
      port: 51365,
      user: 'root',
      password: 'EaQmMwOudmEJPCctahhtuFfamCJJNlmH',
      database: 'railway'
    });

    console.log('Tentando conectar ao banco de dados...');
    await connection.connect();
    console.log('Conectado ao banco de dados de produção com sucesso!');

    // Nova senha para o admin
    const newPassword = process.env.NEW_ADMIN_PASSWORD || 'admin123';
    
    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Primeiro, verificar se o usuário existe
    const [users] = await connection.query(
      'SELECT * FROM users WHERE username = ? AND role = "admin"',
      [process.env.ADMIN_USERNAME || 'admin']
    );

    if (users.length === 0) {
      console.log('Usuário admin não encontrado. Criando novo usuário admin...');
      await connection.query(
        'INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, "admin")',
        [process.env.ADMIN_USERNAME, hashedPassword, process.env.ADMIN_EMAIL]
      );
      console.log('Novo usuário admin criado com sucesso!');
    } else {
      // Atualizar a senha do admin existente
      const [result] = await connection.execute(
        'UPDATE users SET password = ? WHERE username = ? AND role = "admin"',
        [hashedPassword, process.env.ADMIN_USERNAME || 'admin']
      );

      if (result.affectedRows > 0) {
        console.log('Senha do admin atualizada com sucesso!');
        console.log('Nova senha:', newPassword);
      }
    }

  } catch (error) {
    console.error('Erro detalhado:', error);
    if (error.code === 'ECONNREFUSED') {
      console.error('Conexão recusada. Verifique se o servidor está acessível e se a porta está correta.');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('Acesso negado. Verifique as credenciais (usuário/senha).');
    } else if (error.code === 'ENOTFOUND') {
      console.error('Host não encontrado. Verifique o endereço do servidor.');
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('Conexão fechada');
    }
    process.exit(0);
  }
}

resetAdminPassword();