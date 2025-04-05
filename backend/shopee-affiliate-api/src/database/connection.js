const { PrismaClient } = require('@prisma/client');
const apiHelper = require('../utils/apiHelper');

// Validate or build DATABASE_URL from environment variables
const getDatabaseUrl = () => {
  // First try to use DATABASE_URL directly
  if (process.env.DATABASE_URL && apiHelper.validateDatabaseUrl()) {
    return process.env.DATABASE_URL;
  }
  
  // If DATABASE_URL is missing or invalid, try to build it from individual components
  const builtUrl = apiHelper.buildDatabaseUrlFromEnv();
  if (builtUrl) {
    console.log('Built database URL from environment variables');
    return builtUrl;
  }
  
  // If all else fails, use a default for local development only
  if (process.env.NODE_ENV === 'development') {
    console.warn('⚠️ Using default database URL for development. NOT RECOMMENDED FOR PRODUCTION.');
    return 'postgresql://postgres:postgres@localhost:5432/shopee_affiliate?schema=public';
  }
  
  throw new Error('Valid database connection string could not be determined. Check your environment variables.');
};

const useNewDatabase = process.env.USE_NEW_DATABASE === 'true';

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
  errorFormat: 'pretty',
  datasources: {
    db: {
      url: useNewDatabase ? process.env.DATABASE_URL_NEW : getDatabaseUrl(),
    },
  },
});

async function testConnection() {
  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    console.log(`✅ Database connection test successful. Using ${useNewDatabase ? 'NEW' : 'PRIMARY'} database.`);
    return true;
  } catch (error) {
    console.error(`❌ Database connection test failed for ${useNewDatabase ? 'NEW' : 'PRIMARY'} database:`, error.message);
    return false;
  }
}

module.exports = { prisma, testConnection };
