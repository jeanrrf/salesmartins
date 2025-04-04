require('dotenv').config();
const bcrypt = require('bcryptjs');
const User = require('./src/models/user');
const { connectDB } = require('./src/config/database');

// Array com os dados dos administradores a serem criados
const adminUsers = [
  {
    username: 'admin1',
    password: 'admin123',
    email: 'admin1@example.com',
    role: 'admin'
  },
  {
    username: 'jeanadmin',
    password: 'vvh31676685',
    email: 'admin2@example.com',
    role: 'admin'
  },
  {
    username: 'crisadmin',
    password: 'cris123',
    email: 'gerente@example.com',
    role: 'admin'
  }
  // Adicione mais administradores conforme necessário
];

async function createMultipleAdmins() {
  let connection;
  try {
    // Conectar ao banco de dados MySQL
    connection = await connectDB();
    console.log('Conectado ao MySQL');

    let createdCount = 0;
    let skippedCount = 0;

    // Criar cada administrador na lista
    for (const adminData of adminUsers) {
      try {
        // Verificar se o admin já existe
        const existingAdmin = await User.findByUsername(adminData.username);
        
        if (existingAdmin) {
          console.log(`Usuário ${adminData.username} já existe. Pulando...`);
          skippedCount++;
          continue;
        }

        // Hash da senha
        const hashedPassword = await bcrypt.hash(adminData.password, 10);

        // Criar o usuário administrador
        await User.create({
          username: adminData.username,
          password: hashedPassword,
          email: adminData.email,
          role: adminData.role,
          createdAt: new Date()
        });

        console.log(`Administrador ${adminData.username} criado com sucesso!`);
        createdCount++;
      } catch (userError) {
        console.error(`Erro ao criar administrador ${adminData.username}:`, userError);
      }
    }

    console.log(`\nResumo: ${createdCount} administradores criados, ${skippedCount} pulados.`);
  } catch (error) {
    console.error('Erro ao criar administradores:', error);
  } finally {
    // Fechar a conexão
    if (connection) {
      try {
        await connection.end();
        console.log('Desconectado do MySQL');
      } catch (err) {
        console.error('Erro ao fechar conexão com o banco de dados:', err);
      }
    }
  }
}

createMultipleAdmins();