// file: server/init.js
// description: System initialization and service startup module
// module: Server
// License: MIT
// Author: Andrew Donelson
// Copyright 2025 Andrew Donelson

const mongooseConnector = require('./db/mongoose');
const healthMonitor = require('./services/healthMonitor');
const { Account } = require('./models'); // Updated to use Account instead of User
const config = require('./config/database');

/**
 * Initialize the system
 * Connects to databases and starts monitoring services
 */
async function initialize() {
  console.log('Initializing system...');
  
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongooseConnector.connect();
    console.log('MongoDB connected');
    
    // Start health monitoring
    console.log('Starting health monitoring...');
    healthMonitor.start();
    
    // Check for initial admin user
    await ensureAdminUser();
    
    console.log('System initialization complete');
    return true;
  } catch (error) {
    console.error('System initialization failed:', error);
    return false;
  }
}

/**
 * Ensure at least one admin user exists in the system
 * Creates a default admin if none exists
 */
async function ensureAdminUser() {
  try {
    // Check if any admin user exists
    const adminCount = await Account.countDocuments({ isAdmin: true });
    
    if (adminCount === 0 && process.env.CREATE_DEFAULT_ADMIN === 'true') {
      console.log('No admin users found. Creating default admin user...');
      
      // Default admin data (should be changed after first login)
      const defaultAdminWallet = process.env.DEFAULT_ADMIN_WALLET;
      
      if (!defaultAdminWallet) {
        console.warn('DEFAULT_ADMIN_WALLET not set. Skipping default admin creation.');
        return;
      }
      
      // Create default admin user
      const adminUser = new Account({
        username: 'admin',
        walletAddress: defaultAdminWallet.toLowerCase(),
        isAdmin: true,
        nonce: Math.floor(Math.random() * 1000000).toString(),
        createdAt: new Date()
      });
      
      await adminUser.save();
      
      console.log(`Default admin user created with wallet address: ${adminUser.walletAddress}`);
      console.log('IMPORTANT: Secure this account immediately!');
    }
  } catch (error) {
    console.error('Error ensuring admin user:', error);
    throw error;
  }
}

/**
 * Gracefully shut down the system
 */
async function shutdown() {
  console.log('Shutting down system...');
  
  try {
    // Stop health monitoring
    healthMonitor.stop();
    
    // Disconnect from MongoDB
    await mongooseConnector.disconnect();
    
    console.log('System shutdown complete');
    return true;
  } catch (error) {
    console.error('System shutdown failed:', error);
    return false;
  }
}

// Handle process termination signals
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  const success = await shutdown();
  process.exit(success ? 0 : 1);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received. Shutting down gracefully...');
  const success = await shutdown();
  process.exit(success ? 0 : 1);
});

// Export functions for use in server.js
module.exports = {
  initialize,
  shutdown
};