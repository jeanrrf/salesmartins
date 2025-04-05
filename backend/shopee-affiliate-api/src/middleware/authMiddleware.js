const authService = require('../services/authService');

function authMiddleware(req, res, next) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const result = authService.verifyToken(token);
    
    if (!result.success) {
      return res.status(401).json(result);
    }

    // Add user to request
    req.user = result.user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}

module.exports = authMiddleware;
