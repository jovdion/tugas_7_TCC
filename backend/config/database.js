import { Sequelize } from "sequelize";
import dotenv from 'dotenv';

dotenv.config();

const DB_NAME = process.env.DB_NAME;
const DB_USERNAME = process.env.DB_USERNAME;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_HOST = process.env.DB_HOST;
const DB_PORT = process.env.DB_PORT || 3306;
const DB_SOCKET_PATH = process.env.DB_SOCKET_PATH; // For Unix socket connection

console.log('Database Config:', {
  name: DB_NAME,
  host: DB_HOST,
  port: DB_PORT,
  username: DB_USERNAME,
  socketPath: DB_SOCKET_PATH
});

// Configuration for Google Cloud SQL
const sequelizeConfig = {
  host: DB_HOST,
  port: DB_PORT,
  dialect: "mysql",
  dialectOptions: {
    // SSL configuration for Google Cloud SQL
    ssl: {
      require: true,
      rejectUnauthorized: false, // Set to true in production with proper certificates
      // Mengatasi warning TLS ServerName untuk IP address
      checkServerIdentity: () => undefined
    },
    // Connection timeout
    connectTimeout: 30000,
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  logging: false, // Disable logging untuk mengurangi noise
  retry: {
    match: [
      /ETIMEDOUT/,
      /EHOSTUNREACH/,
      /ECONNRESET/,
      /ECONNREFUSED/,
      /ESOCKETTIMEDOUT/,
      /EPIPE/,
      /EAI_AGAIN/,
      /SequelizeConnectionError/,
      /SequelizeConnectionRefusedError/,
      /SequelizeHostNotFoundError/,
      /SequelizeHostNotReachableError/,
      /SequelizeInvalidConnectionError/,
      /SequelizeConnectionTimedOutError/
    ],
    max: 3
  }
};

// If using Unix socket (alternative connection method for Google Cloud SQL)
if (DB_SOCKET_PATH) {
  delete sequelizeConfig.host;
  delete sequelizeConfig.port;
  sequelizeConfig.dialectOptions.socketPath = DB_SOCKET_PATH;
}

// Initialize Sequelize connection
const db = new Sequelize(DB_NAME, DB_USERNAME, DB_PASSWORD, sequelizeConfig);

// Test the connection
const testConnection = async () => {
  try {
    await db.authenticate();
    console.log('✅ Database connection has been established successfully.');
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      original: error.original
    });
  }
};

// Test connection on startup
testConnection();

export default db;