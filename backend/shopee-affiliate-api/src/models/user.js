const bcrypt = require('bcryptjs');
const { connectDB } = require('../config/database');

class User {
  static async findById(id) {
    try {
      const connection = await connectDB();
      const [rows] = await connection.query('SELECT * FROM users WHERE id = ?', [id]);
      return rows[0];
    } catch (error) {
      console.error('Erro ao buscar usuário por ID:', error);
      throw error;
    }
  }

  static async findByUsername(username) {
    try {
      const connection = await connectDB();
      const [rows] = await connection.query('SELECT * FROM users WHERE username = ?', [username]);
      return rows[0];
    } catch (error) {
      console.error('Erro ao buscar usuário por username:', error);
      throw error;
    }
  }

  static async findByEmail(email) {
    try {
      const connection = await connectDB();
      const [rows] = await connection.query('SELECT * FROM users WHERE email = ?', [email]);
      return rows[0];
    } catch (error) {
      console.error('Erro ao buscar usuário por email:', error);
      throw error;
    }
  }

  static async create(userData) {
    const { username, email, password, role } = userData;
    
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const connection = await connectDB();
      const [result] = await connection.query(
        'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
        [username, email, hashedPassword, role || 'user']
      );
      
      return { 
        id: result.insertId, 
        username, 
        email,
        role: role || 'user'
      };
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      throw error;
    }
  }

  static async comparePassword(password, hashedPassword) {
    return bcrypt.compare(password, hashedPassword);
  }
}

module.exports = User;