const jwt = require('jsonwebtoken');

// Hardcoded admin credentials
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

class AuthService {
  async login(username, password) {
    // Check if credentials match the hardcoded admin credentials
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      // Generate JWT token
      const token = jwt.sign(
        { 
          username: ADMIN_USERNAME,
          role: 'admin'
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      return {
        success: true,
        token,
        user: {
          username: ADMIN_USERNAME,
          role: 'admin'
        }
      };
    }

    return {
      success: false,
      message: 'Invalid credentials'
    };
  }

  verifyToken(token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      return {
        success: true,
        user: decoded
      };
    } catch (error) {
      return {
        success: false,
        message: 'Invalid token'
      };
    }
  }
}

module.exports = new AuthService();
