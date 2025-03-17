// file: server/services/storage/UserStorage.js
// description: User storage service with specialized user-related operations
// module: Server
// License: MIT
// Author: Andrew Donelson
// Copyright 2025 Andrew Donelson

const BaseStorage = require('./BaseStorage');
const { User } = require('../../models');

/**
 * User Storage Service
 * Extends BaseStorage with user-specific functionality
 */
class UserStorage extends BaseStorage {
  constructor() {
    super(User, 'users');
  }

  /**
   * Find a user by wallet address
   * @param {String} walletAddress - Ethereum wallet address
   * @param {Object} options - Options (see BaseStorage.findById)
   * @returns {Promise<Object>} The user document
   */
  async findByWalletAddress(walletAddress, options = {}) {
    try {
      // Normalize wallet address
      const normalizedAddress = walletAddress.toLowerCase();
      
      // Find by wallet address instead of ID
      const { checkIntegrity = false, populate = [] } = options;
      
      let query = this.model.findOne({ walletAddress: normalizedAddress });
      
      if (populate.length > 0) {
        query = query.populate(populate);
      }
      
      const document = await query;
      
      if (!document) {
        return null;
      }
      
      // Check integrity if requested
      let integrity = null;
      if (checkIntegrity && document.blockchainVerification?.isVerified) {
        integrity = await this.blockchainVerification.checkDocumentIntegrity(document, this.tableId);
      }
      
      return checkIntegrity ? { document, integrity } : document;
    } catch (error) {
      console.error('User find by wallet error:', error);
      throw new Error(`Failed to find user by wallet address: ${error.message}`);
    }
  }

  /**
   * Register a new user
   * @param {Object} userData - User data including walletAddress and username
   * @param {Object} options - Options (see BaseStorage.create)
   * @returns {Promise<Object>} The created user
   */
  async register(userData, options = {}) {
    try {
      // Check if wallet is already registered
      const existingUser = await this.model.findOne({ 
        walletAddress: userData.walletAddress.toLowerCase() 
      });
      
      if (existingUser) {
        throw new Error('Wallet address is already registered');
      }
      
      // Check if username is taken
      const existingUsername = await this.model.findOne({ 
        username: userData.username 
      });
      
      if (existingUsername) {
        throw new Error('Username is already taken');
      }
      
      // Create the user with blockchain verification
      return await this.create({
        ...userData,
        walletAddress: userData.walletAddress.toLowerCase()
      }, options);
    } catch (error) {
      console.error('User registration error:', error);
      throw new Error(`Failed to register user: ${error.message}`);
    }
  }

  /**
   * Generate a new authentication nonce for a user
   * @param {String} walletAddress - Ethereum wallet address
   * @returns {Promise<String>} The new nonce
   */
  async generateNonce(walletAddress) {
    try {
      // Normalize wallet address
      const normalizedAddress = walletAddress.toLowerCase();
      
      // Find the user
      const user = await this.model.findOne({ walletAddress: normalizedAddress });
      
      if (!user) {
        // If user doesn't exist, create a temporary nonce
        return Math.floor(Math.random() * 1000000).toString();
      }
      
      // Generate and save a new nonce
      const nonce = user.generateNonce();
      await user.save();
      
      return nonce;
    } catch (error) {
      console.error('Nonce generation error:', error);
      throw new Error(`Failed to generate nonce: ${error.message}`);
    }
  }

  /**
   * Update a user's last login time
   * @param {String} walletAddress - Ethereum wallet address
   * @returns {Promise<Object>} Update result
   */
  async updateLastLogin(walletAddress) {
    try {
      // Normalize wallet address
      const normalizedAddress = walletAddress.toLowerCase();
      
      // Update the user
      const user = await this.model.findOneAndUpdate(
        { walletAddress: normalizedAddress },
        { lastLogin: new Date() },
        { new: true }
      );
      
      if (!user) {
        throw new Error('User not found');
      }
      
      return user;
    } catch (error) {
      console.error('Last login update error:', error);
      throw new Error(`Failed to update last login: ${error.message}`);
    }
  }
}

module.exports = new UserStorage();