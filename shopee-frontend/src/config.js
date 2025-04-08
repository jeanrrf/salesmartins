/**
 * Application configuration
 */

const config = {
  // Flag to enable/disable Shopee API attempts
  USE_SHOPEE_API: true,

  // Enable client-side caching
  USE_CACHE: true,

  // API base URL - local backend API
  API_BASE_URL: 'http://localhost:3000',

  // GraphQL endpoint - Shopee API
  GRAPHQL_ENDPOINT: 'http://localhost:8001/graphql',

  // Whether to use mock data in case API fails
  USE_MOCK_DATA: false, // Changed from true to false

  // API timeout in milliseconds
  API_TIMEOUT: 10000, // Increased from 5000 to 10000

  // Retry settings
  MAX_RETRIES: 3,
  RETRY_DELAY: 1500, // Base delay in ms

  // Access control settings
  CORS_ENABLED: true,

  // Skip authentication in development
  SKIP_AUTH: true
};

export default config;
