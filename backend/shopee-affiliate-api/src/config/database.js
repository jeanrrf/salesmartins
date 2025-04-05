// This project uses JSON files for storage instead of a traditional database

// Environment detection
const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
  isUsingDatabase: false,
  
  // Environment configuration
  environment: {
    isProduction,
    isDevelopment: !isProduction
  },
  
  // Module availability configuration
  modules: {
    // Always available in both environments
    salesMartins: true,
    dataAccess: true,
    
    // Only available in development
    categoryRepair: !isProduction,
    searchModule: !isProduction,
    adminPanel: !isProduction,
    dataManagement: !isProduction
  },
  
  // Authentication settings - only needed in development
  auth: {
    enabled: !isProduction,
    adminUsername: 'admin',
    adminPassword: 'admin'
  },
  
  // Data paths configuration
  paths: {
    products: './src/data/products.json',
    categories: './src/data/categories.json'
  }
};
