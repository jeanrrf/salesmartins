/**
 * Application configuration
 */

const config = {
  // API base URL - change this to match your backend server
  API_BASE_URL: 'http://localhost:3000/api',
  
  // Fallback URL in case the primary API is not available
  FALLBACK_API_URL: 'http://localhost:3000/mock_data',
  
  // Whether to use mock data for development
  USE_MOCK_DATA: true,
  
  // API timeout in milliseconds
  API_TIMEOUT: 5000
};

export default config;
