import { Sequelize } from 'sequelize';

const databaseConfig = {
  database: process.env.DB_NAME || 'your_database_name',
  username: process.env.DB_USER || 'your_database_user',
  password: process.env.DB_PASS || 'your_database_password',
  host: process.env.DB_HOST || 'localhost',
  dialect: 'postgres', // or 'mysql', 'sqlite', etc.
  logging: false, // Set to true to enable SQL logging
};

const sequelize = new Sequelize(databaseConfig.database, databaseConfig.username, databaseConfig.password, {
  host: databaseConfig.host,
  dialect: databaseConfig.dialect as 'postgres',
  logging: databaseConfig.logging,
});

export default sequelize;