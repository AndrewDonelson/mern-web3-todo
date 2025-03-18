// file: server/services/healthMonitor.js
// description: Monitoring service for MongoDB and blockchain connection health
// module: Server
// License: MIT
// Author: Andrew Donelson
// Copyright 2025 Andrew Donelson

const mongoose = require('mongoose');
const { Web3 } = require('web3'); // Fixed import with destructuring
const config = require('../config/database');
const mongooseConnector = require('../db/mongoose');
const blockchainThrottler = require('./blockchainThrottler');

/**
* Service for monitoring system health and connections
*/
class HealthMonitor {
 constructor() {
   this.status = {
     mongodb: {
       connected: false,
       lastCheck: null,
       error: null,
       responseTime: null
     },
     blockchain: {
       connected: false,
       lastCheck: null,
       error: null,
       networkId: null,
       blockNumber: null,
       responseTime: null
     },
     system: {
       uptime: 0,
       startTime: Date.now(),
       memoryUsage: null
     }
   };
   
   // Initialize Web3 instance
   this.web3 = new Web3(config.blockchain.uri);
   
   // Set checking intervals (in milliseconds)
   this.mongoCheckInterval = 30000; // 30 seconds
   this.blockchainCheckInterval = 60000; // 1 minute
   this.systemCheckInterval = 60000; // 1 minute
   
   // Automatic recovery options
   this.autoRecover = true;
   this.recoveryAttempts = 0;
   this.maxRecoveryAttempts = 5;
 }

 /**
  * Start the health monitoring service
  */
 start() {
   console.log('Starting health monitoring service');
   
   // Perform initial checks
   this.checkMongoDB();
   this.checkBlockchain();
   this.checkSystemHealth();
   
   // Set up monitoring intervals
   this.mongoIntervalId = setInterval(() => this.checkMongoDB(), this.mongoCheckInterval);
   this.blockchainIntervalId = setInterval(() => this.checkBlockchain(), this.blockchainCheckInterval);
   this.systemIntervalId = setInterval(() => this.checkSystemHealth(), this.systemCheckInterval);
   
   // Make intervals immune to unhandled promise rejections
   this.mongoIntervalId.unref();
   this.blockchainIntervalId.unref();
   this.systemIntervalId.unref();
 }

 /**
  * Stop the health monitoring service
  */
 stop() {
   console.log('Stopping health monitoring service');
   
   // Clear intervals
   clearInterval(this.mongoIntervalId);
   clearInterval(this.blockchainIntervalId);
   clearInterval(this.systemIntervalId);
 }

 /**
  * Check MongoDB connection health
  * @returns {Promise<boolean>} Connection status
  */
 async checkMongoDB() {
   const startTime = Date.now();
   
   try {
     let connected = false;
     
     // Check if already connected
     if (mongooseConnector.isConnected()) {
       // Verify connection with a ping
       await mongoose.connection.db.admin().ping();
       connected = true;
     } else {
       // Attempt to connect if not connected
       if (this.autoRecover) {
         await mongooseConnector.connect();
         connected = true;
         this.recoveryAttempts = 0;
       }
     }
     
     const responseTime = Date.now() - startTime;
     
     // Update status
     this.status.mongodb = {
       connected,
       lastCheck: new Date(),
       error: null,
       responseTime
     };
     
     return connected;
   } catch (error) {
     const responseTime = Date.now() - startTime;
     
     // Update status with error
     this.status.mongodb = {
       connected: false,
       lastCheck: new Date(),
       error: error.message,
       responseTime
     };
     
     console.error(`MongoDB health check failed: ${error.message}`);
     
     // Attempt recovery if enabled
     if (this.autoRecover && this.recoveryAttempts < this.maxRecoveryAttempts) {
       this.recoveryAttempts++;
       console.log(`Attempting MongoDB recovery (${this.recoveryAttempts}/${this.maxRecoveryAttempts})...`);
       
       // Schedule recovery attempt
       setTimeout(() => {
         mongooseConnector.connect().catch(err => {
           console.error(`MongoDB recovery attempt failed: ${err.message}`);
         });
       }, 5000);
     }
     
     return false;
   }
 }

 /**
  * Check blockchain connection health
  * @returns {Promise<boolean>} Connection status
  */
 async checkBlockchain() {
   const startTime = Date.now();
   
   try {
     // Check connection by getting network ID and latest block
     const networkId = await this.web3.eth.net.getId();
     const blockNumber = await this.web3.eth.getBlockNumber();
     
     const responseTime = Date.now() - startTime;
     
     // Validate network ID if specified in config
     const correctNetwork = config.blockchain.networkId ? 
       networkId === config.blockchain.networkId : true;
     
     // Update status
     this.status.blockchain = {
       connected: true,
       lastCheck: new Date(),
       error: correctNetwork ? null : `Wrong network ID: ${networkId} (expected ${config.blockchain.networkId})`,
       networkId,
       blockNumber,
       correctNetwork,
       responseTime
     };
     
     // Log warning if on wrong network
     if (!correctNetwork) {
       console.warn(`Connected to wrong blockchain network: ${networkId} (expected ${config.blockchain.networkId})`);
     }
     
     return true;
   } catch (error) {
     const responseTime = Date.now() - startTime;
     
     // Update status with error
     this.status.blockchain = {
       connected: false,
       lastCheck: new Date(),
       error: error.message,
       networkId: null,
       blockNumber: null,
       responseTime
     };
     
     console.error(`Blockchain health check failed: ${error.message}`);
     
     // Attempt recovery by reinitializing Web3
     if (this.autoRecover) {
       console.log('Attempting to reinitialize blockchain connection...');
       try {
         this.web3 = new Web3(config.blockchain.uri);
       } catch (err) {
         console.error(`Failed to reinitialize blockchain connection: ${err.message}`);
       }
     }
     
     return false;
   }
 }

 /**
  * Check overall system health
  */
 checkSystemHealth() {
   // Get system metrics
   const memoryUsage = process.memoryUsage();
   const uptime = Math.floor((Date.now() - this.status.system.startTime) / 1000);
   
   // Update status
   this.status.system = {
     uptime,
     startTime: this.status.system.startTime,
     memoryUsage: {
       rss: Math.round(memoryUsage.rss / 1024 / 1024), // RSS in MB
       heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // Heap total in MB
       heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // Heap used in MB
       external: Math.round(memoryUsage.external / 1024 / 1024) // External in MB
     }
   };
   
   // Check for memory issues
   const heapUsedPercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
   if (heapUsedPercent > 90) {
     console.warn(`High memory usage: ${heapUsedPercent.toFixed(2)}% of heap used`);
   }
 }

 /**
  * Get current health status
  * @returns {Object} System health status
  */
 getStatus() {
   return {
     ...this.status,
     throttler: blockchainThrottler.getStatus(),
     healthy: this.isHealthy(),
     timestamp: new Date()
   };
 }

 /**
  * Check if the system is healthy
  * @returns {boolean} True if all systems are healthy
  */
 isHealthy() {
   return (
     this.status.mongodb.connected &&
     this.status.blockchain.connected &&
     (this.status.blockchain.correctNetwork !== false)
   );
 }

 /**
  * Set auto-recovery option
  * @param {boolean} enabled Whether to enable auto-recovery
  */
 setAutoRecover(enabled) {
   this.autoRecover = enabled;
   console.log(`Auto-recovery ${enabled ? 'enabled' : 'disabled'}`);
 }

 /**
  * Get detailed health information for diagnostics
  * @returns {Object} Detailed health information
  */
 async getDiagnostics() {
   try {
     // Perform immediate checks
     await this.checkMongoDB();
     await this.checkBlockchain();
     this.checkSystemHealth();
     
     // Get additional MongoDB information
     let mongoDbDetails = null;
     if (mongooseConnector.isConnected()) {
       try {
         const connection = mongoose.connection;
         const dbStats = await connection.db.stats();
         mongoDbDetails = {
           dbName: connection.name,
           collections: Object.keys(connection.collections).length,
           dbStats: {
             dataSize: Math.round(dbStats.dataSize / 1024 / 1024), // MB
             storageSize: Math.round(dbStats.storageSize / 1024 / 1024), // MB
             indexes: dbStats.indexes,
             objects: dbStats.objects
           }
         };
       } catch (err) {
         mongoDbDetails = { error: err.message };
       }
     }
     
     // Get additional blockchain information
     let blockchainDetails = null;
     if (this.status.blockchain.connected) {
       try {
         const [chainId, gasPrice, isSyncing, peerCount] = await Promise.all([
           this.web3.eth.getChainId(),
           this.web3.eth.getGasPrice(),
           this.web3.eth.isSyncing(),
           this.web3.eth.net.getPeerCount()
         ]);
         
         blockchainDetails = {
           chainId,
           gasPrice: this.web3.utils.fromWei(gasPrice, 'gwei') + ' gwei',
           isSyncing,
           peerCount,
           provider: this.web3.currentProvider.constructor.name
         };
       } catch (err) {
         blockchainDetails = { error: err.message };
       }
     }
     
     return {
       status: this.getStatus(),
       details: {
         mongodb: mongoDbDetails,
         blockchain: blockchainDetails,
         system: {
           platform: process.platform,
           nodeVersion: process.version,
           cpuUsage: process.cpuUsage(),
           env: process.env.NODE_ENV || 'development'
         }
       }
     };
   } catch (error) {
     console.error('Error getting diagnostics:', error);
     return {
       status: this.getStatus(),
       error: error.message
     };
   }
 }
}

// Export singleton instance
module.exports = new HealthMonitor();