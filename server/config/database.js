// file: server/config/database.js
// description: Configuration for MongoDB and blockchain connections
// module: Server
// License: MIT
// Author: Andrew Donelson
// Copyright 2025 Andrew Donelson

const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

/**
 * Configuration for database and blockchain connections
 * Uses environment variables with sensible defaults
 */
const config = {
  // MongoDB Configuration
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/web3todo',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: process.env.MONGODB_POOL_SIZE || 10,
      minPoolSize: 2,
      retryWrites: true,
      retryReads: true
    },
    // Optional auth if not using connection string with credentials
    auth: process.env.MONGODB_AUTH === 'true' ? {
      user: process.env.MONGODB_USER,
      password: process.env.MONGODB_PASSWORD
    } : null,
    // Connection timeout in milliseconds
    connectTimeoutMS: parseInt(process.env.MONGODB_CONNECT_TIMEOUT) || 10000,
    // Database name (can be overridden by URI)
    dbName: process.env.MONGODB_DB_NAME || 'web3todo'
  },
  
  // Blockchain Configuration
  blockchain: {
    // URI for the blockchain provider (e.g., local node, Infura, etc.)
    uri: process.env.BLOCKCHAIN_URI || 'http://localhost:7545',
    // Default account to use for transactions
    defaultAccount: process.env.DEFAULT_ACCOUNT,
    // Smart contract addresses
    contracts: {
      verification: process.env.VERIFICATION_CONTRACT_ADDRESS,
      todoList: process.env.TODO_LIST_CONTRACT_ADDRESS
    },
    // Gas settings
    gas: {
      limit: parseInt(process.env.GAS_LIMIT) || 3000000,
      price: process.env.GAS_PRICE || null // null means use network estimation
    },
    // Network ID (for validation)
    networkId: parseInt(process.env.NETWORK_ID) || 1337,
    // Operations throttling to prevent excessive gas consumption
    throttle: {
      // Maximum operations per minute
      maxOpsPerMinute: parseInt(process.env.BLOCKCHAIN_OPS_PER_MINUTE) || 10,
      // Maximum batch size for batch operations
      maxBatchSize: parseInt(process.env.BLOCKCHAIN_MAX_BATCH_SIZE) || 50
    }
  },
  
  // Verification settings
  verification: {
    // Enable/disable blockchain verification (for testing or development)
    enabled: process.env.BLOCKCHAIN_VERIFICATION_ENABLED !== 'false',
    // Default verification mode for new documents
    defaultVerifyMode: process.env.DEFAULT_VERIFY_MODE || 'immediate', // 'immediate', 'batch', 'manual'
    // Number of confirmations required before considering a transaction final
    requiredConfirmations: parseInt(process.env.REQUIRED_CONFIRMATIONS) || 1,
    // Maximum documents to include in automatic batch operations
    batchSize: parseInt(process.env.VERIFICATION_BATCH_SIZE) || 20,
    // Interval in minutes for processing batch verifications
    batchInterval: parseInt(process.env.VERIFICATION_BATCH_INTERVAL) || 15
  }
};

/**
 * Get MongoDB connection URI with appropriate options and authentication
 * @returns {String} MongoDB connection URI
 */
function getMongoURI() {
  if (config.mongodb.uri) {
    return config.mongodb.uri;
  }
  
  // If no URI is provided, construct one from components
  let uri = 'mongodb://';
  
  // Add authentication if provided
  if (config.mongodb.auth && config.mongodb.auth.user && config.mongodb.auth.password) {
    uri += `${encodeURIComponent(config.mongodb.auth.user)}:${encodeURIComponent(config.mongodb.auth.password)}@`;
  }
  
  // Add host and database
  uri += `${process.env.MONGODB_HOST || 'localhost'}:${process.env.MONGODB_PORT || '27017'}`;
  uri += `/${config.mongodb.dbName}`;
  
  // Add query parameters if needed
  const authSource = process.env.MONGODB_AUTH_SOURCE;
  if (authSource) {
    uri += `?authSource=${authSource}`;
  }
  
  return uri;
}

module.exports = {
  ...config,
  getMongoURI
};