// file: server/routes/health.routes.js
// description: API routes for system health monitoring
// module: Server
// License: MIT
// Author: Andrew Donelson
// Copyright 2025 Andrew Donelson

const express = require('express');
const router = express.Router();
const healthMonitor = require('../services/healthMonitor');
const blockchainThrottler = require('../services/blockchainThrottler');

// Middleware for admin authentication
const adminAuth = require('../middleware/adminAuth');

/**
 * @route GET /api/health
 * @description Get basic health status
 * @access Public
 */
router.get('/', (req, res) => {
  const status = healthMonitor.getStatus();
  
  // Simplified response for public endpoint
  const publicStatus = {
    healthy: status.healthy,
    services: {
      mongodb: status.mongodb.connected,
      blockchain: status.blockchain.connected
    },
    timestamp: status.timestamp
  };
  
  // Set appropriate status code based on health
  const statusCode = status.healthy ? 200 : 503;
  
  res.status(statusCode).json(publicStatus);
});

/**
 * @route GET /api/health/detailed
 * @description Get detailed health status
 * @access Admin
 */
router.get('/detailed', adminAuth, (req, res) => {
  const status = healthMonitor.getStatus();
  
  res.json({
    ...status,
    routes: {
      basic: '/api/health',
      detailed: '/api/health/detailed',
      diagnostics: '/api/health/diagnostics',
      actions: '/api/health/actions'
    }
  });
});

/**
 * @route GET /api/health/diagnostics
 * @description Get diagnostic information for troubleshooting
 * @access Admin
 */
router.get('/diagnostics', adminAuth, async (req, res) => {
  try {
    const diagnostics = await healthMonitor.getDiagnostics();
    res.json(diagnostics);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get diagnostics',
      message: error.message
    });
  }
});

/**
 * @route POST /api/health/actions/check
 * @description Force an immediate health check
 * @access Admin
 */
router.post('/actions/check', adminAuth, async (req, res) => {
  try {
    // Perform immediate checks
    const mongoStatus = await healthMonitor.checkMongoDB();
    const blockchainStatus = await healthMonitor.checkBlockchain();
    healthMonitor.checkSystemHealth();
    
    res.json({
      success: true,
      mongodb: mongoStatus,
      blockchain: blockchainStatus,
      status: healthMonitor.getStatus()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Health check failed',
      message: error.message
    });
  }
});

/**
 * @route POST /api/health/actions/recover
 * @description Force recovery attempts for failing connections
 * @access Admin
 */
router.post('/actions/recover', adminAuth, async (req, res) => {
  try {
    const status = healthMonitor.getStatus();
    const recovery = {
      mongodb: false,
      blockchain: false
    };
    
    // Attempt MongoDB recovery if needed
    if (!status.mongodb.connected) {
      try {
        const mongooseConnector = require('../db/mongoose');
        await mongooseConnector.connect();
        recovery.mongodb = true;
      } catch (error) {
        recovery.mongodb = false;
        recovery.mongodbError = error.message;
      }
    }
    
    // Attempt blockchain recovery if needed
    if (!status.blockchain.connected) {
      try {
        const Web3 = require('web3');
        const config = require('../config/database');
        healthMonitor.web3 = new Web3(config.blockchain.uri);
        await healthMonitor.checkBlockchain();
        recovery.blockchain = status.blockchain.connected;
      } catch (error) {
        recovery.blockchain = false;
        recovery.blockchainError = error.message;
      }
    }
    
    res.json({
      success: true,
      recovery,
      status: healthMonitor.getStatus()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Recovery attempt failed',
      message: error.message
    });
  }
});

/**
 * @route POST /api/health/actions/throttle
 * @description Configure blockchain throttling
 * @access Admin
 */
router.post('/actions/throttle', adminAuth, (req, res) => {
  try {
    const { operationType, locked } = req.body;
    
    // Validate input
    if (!operationType || typeof locked !== 'boolean') {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'operationType and locked (boolean) are required'
      });
    }
    
    // Set the operation lock
    blockchainThrottler.setOperationLock(operationType, locked);
    
    res.json({
      success: true,
      message: `${operationType} operations ${locked ? 'locked' : 'unlocked'}`,
      throttlerStatus: blockchainThrottler.getStatus()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to configure throttling',
      message: error.message
    });
  }
});

module.exports = router;