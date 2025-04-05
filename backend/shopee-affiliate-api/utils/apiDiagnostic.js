const axios = require('axios');
const fs = require('fs');
const path = require('path');

/**
 * Utilitário para diagnosticar problemas com a API da Shopee Affiliate
 */
class ApiDiagnostic {
  constructor(baseUrl, apiKey) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
    this.logPath = path.join(__dirname, '../logs');
    
    // Garantir que o diretório de logs existe
    if (!fs.existsSync(this.logPath)) {
      fs.mkdirSync(this.logPath, { recursive: true });
    }
  }

  /**
   * Testa a conectividade com um endpoint específico
   */
  async testEndpoint(endpoint) {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      console.log(`Testando endpoint: ${url}`);
      
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        validateStatus: false // Não lançar erro para status codes não-2xx
      });

      const result = {
        url,
        statusCode: response.status,
        statusText: response.statusText,
        isSuccess: response.status >= 200 && response.status < 300,
        timestamp: new Date().toISOString()
      };

      this.logResult(endpoint, result);
      return result;
    } catch (error) {
      const result = {
        url: `${this.baseUrl}${endpoint}`,
        error: error.message,
        isSuccess: false,
        timestamp: new Date().toISOString()
      };
      
      this.logResult(endpoint, result);
      return result;
    }
  }

  /**
   * Testa vários endpoints comuns da API
   */
  async runDiagnostics() {
    const commonEndpoints = [
      '/products',
      '/categories',
      '/offers',
      '/banners',
      '/campaigns',
      '/auth/validate'
    ];

    const results = [];
    for (const endpoint of commonEndpoints) {
      results.push(await this.testEndpoint(endpoint));
    }

    return results;
  }

  /**
   * Registra os resultados em um arquivo de log
   */
  logResult(endpoint, result) {
    const logFile = path.join(this.logPath, `api_diagnostics_${new Date().toISOString().split('T')[0]}.log`);
    const logEntry = `${new Date().toISOString()} - ${endpoint} - Status: ${result.statusCode || 'ERROR'} - ${JSON.stringify(result)}\n`;
    
    fs.appendFileSync(logFile, logEntry);
  }
}

module.exports = ApiDiagnostic;
