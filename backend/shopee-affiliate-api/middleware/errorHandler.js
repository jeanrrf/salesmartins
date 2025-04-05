const fs = require('fs');
const path = require('path');

/**
 * Middleware para tratar erros na API
 */
class ErrorHandler {
  constructor() {
    this.logPath = path.join(__dirname, '../logs');
    
    // Garantir que o diretório de logs existe
    if (!fs.existsSync(this.logPath)) {
      fs.mkdirSync(this.logPath, { recursive: true });
    }
  }

  /**
   * Middleware que captura erros HTTP
   */
  handleHttpErrors(error, req, res, next) {
    // Processar erro 404
    if (error.response && error.response.status === 404) {
      this.logError({
        path: req.path,
        message: 'Resource not found (404)',
        timestamp: new Date().toISOString(),
        requestParams: req.params,
        requestQuery: req.query,
        headers: req.headers
      });

      return res.status(404).json({
        error: 'Resource not found',
        message: 'The requested API endpoint or resource does not exist.',
        possibleReasons: [
          'URL might be incorrect',
          'Resource might have been moved or removed',
          'API version might be outdated'
        ],
        suggestions: [
          'Check the API documentation for correct endpoints',
          'Verify your API credentials and permissions',
          'Contact support if the problem persists'
        ]
      });
    }

    // Outros erros
    this.logError({
      path: req.path,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    res.status(error.status || 500).json({
      error: error.message || 'Internal Server Error',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Registra erros em arquivo de log
   */
  logError(errorData) {
    const logFile = path.join(this.logPath, `errors_${new Date().toISOString().split('T')[0]}.log`);
    const logEntry = `${new Date().toISOString()} - ${JSON.stringify(errorData)}\n`;
    
    fs.appendFileSync(logFile, logEntry);
  }
}

module.exports = new ErrorHandler();
