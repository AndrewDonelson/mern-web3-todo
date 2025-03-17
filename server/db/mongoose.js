// file: server/db/mongoose.js
// description: MongoDB connection management with Mongoose
// module: Server
// License: MIT
// Author: Andrew Donelson
// Copyright 2025 Andrew Donelson

const mongoose = require('mongoose');
const config = require('../config/database');

// Track connection state
let isConnected = false;
let isConnecting = false;
let connectionRetries = 0;
const MAX_RETRIES = 5;

/**
 * Connect to MongoDB using Mongoose
 * @returns {Promise<mongoose.Connection>} Mongoose connection
 */
async function connect() {
  // Prevent multiple simultaneous connection attempts
  if (isConnecting) {
    console.log('Connection already in progress, waiting...');
    return waitForConnection();
  }
  
  // Return existing connection if already connected
  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }
  
  try {
    isConnecting = true;
    
    // Get MongoDB URI from config
    const uri = config.getMongoURI();
    
    // Set up Mongoose event listeners
    setupMongooseEventListeners();
    
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(uri, config.mongodb.options);
    
    isConnected = true;
    isConnecting = false;
    connectionRetries = 0;
    
    console.log('MongoDB connected successfully');
    return mongoose.connection;
  } catch (error) {
    isConnecting = false;
    
    // Handle connection errors
    console.error(`MongoDB connection error: ${error.message}`);
    
    // Implement connection retry logic
    if (connectionRetries < MAX_RETRIES) {
      connectionRetries++;
      const retryDelay = 1000 * Math.pow(2, connectionRetries); // Exponential backoff
      console.log(`Retrying connection in ${retryDelay / 1000} seconds (attempt ${connectionRetries}/${MAX_RETRIES})...`);
      
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      return connect();
    }
    
    throw new Error(`Failed to connect to MongoDB after ${MAX_RETRIES} attempts: ${error.message}`);
  }
}

/**
 * Set up Mongoose event listeners for connection management
 */
function setupMongooseEventListeners() {
  const connection = mongoose.connection;
  
  // Handle successful connection
  connection.on('connected', () => {
    console.log('Mongoose connected to MongoDB');
    isConnected = true;
  });
  
  // Handle connection errors
  connection.on('error', (err) => {
    console.error(`Mongoose connection error: ${err.message}`);
    isConnected = false;
  });
  
  // Handle disconnection
  connection.on('disconnected', () => {
    console.log('Mongoose disconnected from MongoDB');
    isConnected = false;
  });
  
  // Handle reconnection
  connection.on('reconnected', () => {
    console.log('Mongoose reconnected to MongoDB');
    isConnected = true;
  });
  
  // Handle Node process termination - close connection gracefully
  process.on('SIGINT', async () => {
    try {
      await connection.close();
      console.log('Mongoose connection closed due to application termination');
      process.exit(0);
    } catch (err) {
      console.error('Error closing Mongoose connection:', err);
      process.exit(1);
    }
  });
}

/**
 * Wait for an in-progress connection to complete
 * @returns {Promise<mongoose.Connection>} Mongoose connection
 */
async function waitForConnection() {
  return new Promise((resolve, reject) => {
    // Check connection status every 100ms
    const checkInterval = setInterval(() => {
      if (!isConnecting) {
        clearInterval(checkInterval);
        if (isConnected) {
          resolve(mongoose.connection);
        } else {
          reject(new Error('Connection failed'));
        }
      }
    }, 100);
    
    // Set a timeout to prevent indefinite waiting
    setTimeout(() => {
      clearInterval(checkInterval);
      reject(new Error('Timed out waiting for database connection'));
    }, 30000); // 30 second timeout
  });
}

/**
 * Disconnect from MongoDB
 * @returns {Promise<void>}
 */
async function disconnect() {
  if (!isConnected) {
    return;
  }
  
  try {
    await mongoose.connection.close();
    isConnected = false;
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error(`Error disconnecting from MongoDB: ${error.message}`);
    throw error;
  }
}

/**
 * Check if connected to MongoDB
 * @returns {boolean} True if connected
 */
function isConnectedToMongoDB() {
  return isConnected && mongoose.connection.readyState === 1;
}

/**
 * Get the current MongoDB connection
 * @returns {mongoose.Connection|null} Mongoose connection or null if not connected
 */
function getConnection() {
  return isConnected ? mongoose.connection : null;
}

module.exports = {
  connect,
  disconnect,
  isConnected: isConnectedToMongoDB,
  getConnection
};