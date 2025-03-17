// file: server/services/blockchainThrottler.js
// description: Service for rate limiting and throttling blockchain operations
// module: Server
// License: MIT
// Author: Andrew Donelson
// Copyright 2025 Andrew Donelson

const config = require('../config/database');

/**
 * Service for rate limiting and throttling blockchain operations
 * Prevents excessive gas consumption and transaction flooding
 */
class BlockchainThrottler {
  constructor() {
    // Load configuration
    this.maxOpsPerMinute = config.blockchain.throttle.maxOpsPerMinute;
    this.maxBatchSize = config.blockchain.throttle.maxBatchSize;
    
    // Initialize operation tracking
    this.operationTimestamps = [];
    this.operationQueue = [];
    this.processingQueue = false;
    this.activeOperations = 0;
    this.maxConcurrentOperations = 3; // Maximum concurrent blockchain operations
    
    // Create operation locks by type
    this.operationLocks = {
      verification: false,
      batchVerification: false,
      deletion: false,
      archiving: false
    };
  }

  /**
   * Check if operations are being throttled
   * @returns {boolean} True if operations are currently throttled
   */
  isThrottled() {
    // Remove timestamps older than 1 minute
    const oneMinuteAgo = Date.now() - 60000;
    this.operationTimestamps = this.operationTimestamps.filter(
      timestamp => timestamp > oneMinuteAgo
    );
    
    // Check if we've reached the rate limit
    return this.operationTimestamps.length >= this.maxOpsPerMinute;
  }

  /**
   * Execute a blockchain operation with throttling
   * @param {Function} operation - Async function to execute
   * @param {string} operationType - Type of operation for locking
   * @param {Object} options - Options for execution
   * @param {boolean} options.priority - Whether this operation has priority
   * @param {number} options.timeout - Operation timeout in milliseconds
   * @returns {Promise<any>} Result of the operation
   */
  async executeOperation(operation, operationType = 'verification', options = {}) {
    const { priority = false, timeout = 60000 } = options;
    
    // Check if this type of operation is locked
    if (this.operationLocks[operationType]) {
      throw new Error(`${operationType} operations are currently locked`);
    }
    
    // Check if we need to throttle
    if (this.isThrottled() && !priority) {
      // Add to queue instead of executing immediately
      return new Promise((resolve, reject) => {
        const queueItem = { operation, operationType, options, resolve, reject };
        
        // Add with priority or to the end
        if (priority) {
          this.operationQueue.unshift(queueItem);
        } else {
          this.operationQueue.push(queueItem);
        }
        
        // Start queue processor if not already running
        if (!this.processingQueue) {
          this.processQueue();
        }
        
        // Set timeout to prevent indefinite waiting
        setTimeout(() => {
          // Remove from queue if still there
          const index = this.operationQueue.findIndex(item => item === queueItem);
          if (index !== -1) {
            this.operationQueue.splice(index, 1);
            reject(new Error(`Operation timed out after ${timeout}ms`));
          }
        }, timeout);
      });
    }
    
    // Execute the operation with tracking
    return this.trackOperation(operation, operationType);
  }

  /**
   * Track a blockchain operation and record its timestamp
   * @param {Function} operation - Async function to execute
   * @param {string} operationType - Type of operation for locking
   * @returns {Promise<any>} Result of the operation
   */
  async trackOperation(operation, operationType) {
    try {
      // Increment active operations counter
      this.activeOperations++;
      
      // Record the operation timestamp
      this.operationTimestamps.push(Date.now());
      
      // Execute the operation
      const result = await operation();
      
      return result;
    } catch (error) {
      console.error(`Blockchain operation error (${operationType}):`, error);
      throw error;
    } finally {
      // Decrement active operations counter
      this.activeOperations--;
    }
  }

  /**
   * Process the operation queue when throttled
   */
  async processQueue() {
    if (this.processingQueue || this.operationQueue.length === 0) {
      return;
    }
    
    this.processingQueue = true;
    
    try {
      while (this.operationQueue.length > 0) {
        // Wait until we're under the rate limit and have available concurrency slots
        await this.waitForAvailableSlot();
        
        // Get the next operation from the queue
        const { operation, operationType, resolve, reject } = this.operationQueue.shift();
        
        // Execute the operation
        this.trackOperation(operation, operationType)
          .then(resolve)
          .catch(reject);
      }
    } finally {
      this.processingQueue = false;
    }
  }

  /**
   * Wait until an operation slot is available
   * @returns {Promise<void>}
   */
  async waitForAvailableSlot() {
    // Helper to check if a slot is available
    const isSlotAvailable = () => {
      return !this.isThrottled() && this.activeOperations < this.maxConcurrentOperations;
    };
    
    // If a slot is already available, return immediately
    if (isSlotAvailable()) {
      return;
    }
    
    // Otherwise, wait for a slot to become available
    return new Promise(resolve => {
      const checkInterval = setInterval(() => {
        if (isSlotAvailable()) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
    });
  }

  /**
   * Batch multiple items for efficient blockchain operations
   * @param {Array<any>} items - Items to batch
   * @param {Function} batchOperation - Function to process a batch
   * @param {Object} options - Batching options
   * @param {number} options.maxBatchSize - Maximum batch size (defaults to config)
   * @returns {Promise<Array<any>>} Results of batch operations
   */
  async batchItems(items, batchOperation, options = {}) {
    const maxBatchSize = options.maxBatchSize || this.maxBatchSize;
    
    // If items fit in a single batch, process directly
    if (items.length <= maxBatchSize) {
      return this.executeOperation(
        () => batchOperation(items),
        'batchVerification',
        options
      );
    }
    
    // Otherwise, split into multiple batches
    const batches = [];
    for (let i = 0; i < items.length; i += maxBatchSize) {
      batches.push(items.slice(i, i + maxBatchSize));
    }
    
    // Process each batch
    const results = [];
    for (const batch of batches) {
      const batchResults = await this.executeOperation(
        () => batchOperation(batch),
        'batchVerification',
        options
      );
      results.push(...batchResults);
    }
    
    return results;
  }

  /**
   * Lock a specific type of operation (for maintenance or emergency)
   * @param {string} operationType - Type of operation to lock
   * @param {boolean} locked - Whether to lock or unlock
   */
  setOperationLock(operationType, locked = true) {
    if (this.operationLocks.hasOwnProperty(operationType)) {
      this.operationLocks[operationType] = locked;
      console.log(`${operationType} operations ${locked ? 'locked' : 'unlocked'}`);
    } else {
      throw new Error(`Unknown operation type: ${operationType}`);
    }
  }

  /**
   * Get the current status of the throttler
   * @returns {Object} Status information
   */
  getStatus() {
    return {
      activeOperations: this.activeOperations,
      queueLength: this.operationQueue.length,
      recentOperations: this.operationTimestamps.length,
      throttled: this.isThrottled(),
      operationLocks: { ...this.operationLocks }
    };
  }
}

// Export singleton instance
module.exports = new BlockchainThrottler();