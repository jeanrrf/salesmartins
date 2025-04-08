/**
 * Application configuration
 */

const config = {
  // Garantir que sempre tentamos usar a API real
  USE_SHOPEE_API: true,

  // Cache mínimo para melhor desempenho mas dados sempre atualizados
  USE_CACHE: true,
  CACHE_DURATION: 60000, // 1 minuto apenas

  // API base URL - backend real
  API_BASE_URL: 'http://localhost:3000',

  // GraphQL endpoint - Shopee API
  GRAPHQL_ENDPOINT: 'http://localhost:8001/graphql',

  // Desativar completamente o uso de dados mock
  USE_MOCK_DATA: false,

  // Configuração otimizada para API real
  API_TIMEOUT: 15000,
  MAX_RETRIES: 3,
  RETRY_DELAY: 2000,

  // Access control settings
  CORS_ENABLED: true,
  SKIP_AUTH: false
};

export default config;
