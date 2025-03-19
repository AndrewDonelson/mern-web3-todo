// file: server/services/storage/AccountStorage.js
// description: Unified storage service for account operations (replaces separate User and Profile storage)
// module: Server
// License: MIT
// Author: Andrew Donelson
// Copyright 2025 Andrew Donelson

const BaseStorage = require('./BaseStorage');
const { Account } = require('../../models');
const blockchainVerification = require('../blockchainVerification');

/**
 * Account Storage Service
 * Combines functionality from UserStorage and ProfileStorage 
 * into a unified service for the Account model
 */
class AccountStorage extends BaseStorage {
  constructor() {
    super(Account, 'accounts');
  }

  /**
   * Find an account by wallet address
   * @param {String} walletAddress - Ethereum wallet address
   * @param {Object} options - Options (see BaseStorage.findById)
   * @returns {Promise<Object>} The account document
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
        integrity = await blockchainVerification.checkDocumentIntegrity(document, this.tableId);
      }
      
      return checkIntegrity ? { document, integrity } : document;
    } catch (error) {
      console.error('Account find by wallet error:', error);
      throw new Error(`Failed to find account by wallet address: ${error.message}`);
    }
  }

  /**
   * Find an account by username
   * @param {String} username - Username
   * @param {Object} options - Options (see BaseStorage.findById)
   * @returns {Promise<Object>} The account document
   */
  async findByUsername(username, options = {}) {
    try {
      // Find by username
      const { checkIntegrity = false, populate = [] } = options;
      
      let query = this.model.findOne({ username });
      
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
        integrity = await blockchainVerification.checkDocumentIntegrity(document, this.tableId);
      }
      
      return checkIntegrity ? { document, integrity } : document;
    } catch (error) {
      console.error('Account find by username error:', error);
      throw new Error(`Failed to find account by username: ${error.message}`);
    }
  }

  /**
   * Register a new account
   * @param {Object} accountData - Account data including walletAddress and username
   * @param {Object} options - Options (see BaseStorage.create)
   * @returns {Promise<Object>} The created account
   */
  async register(accountData, options = {}) {
    try {
      // Normalize wallet address
      const normalizedWalletAddress = accountData.walletAddress.toLowerCase();
      
      // Check if wallet is already registered
      const existingAccount = await this.model.findOne({ 
        walletAddress: normalizedWalletAddress
      });
      
      if (existingAccount) {
        throw new Error('Wallet address is already registered');
      }
      
      // Check if username is taken
      const existingUsername = await this.model.findOne({ 
        username: accountData.username 
      });
      
      if (existingUsername) {
        throw new Error('Username is already taken');
      }
      
      // Create the account with blockchain verification
      return await this.create({
        ...accountData,
        walletAddress: normalizedWalletAddress
      }, options);
    } catch (error) {
      console.error('Account registration error:', error);
      throw new Error(`Failed to register account: ${error.message}`);
    }
  }

  /**
   * Generate a new authentication nonce for an account
   * @param {String} walletAddress - Ethereum wallet address
   * @returns {Promise<String>} The new nonce
   */
  async generateNonce(walletAddress) {
    try {
      // Normalize wallet address
      const normalizedAddress = walletAddress.toLowerCase();
      
      // Find the account
      const account = await this.model.findOne({ walletAddress: normalizedAddress });
      
      if (!account) {
        // If account doesn't exist, create a temporary nonce
        return Math.floor(Math.random() * 1000000).toString();
      }
      
      // Generate and save a new nonce
      const nonce = account.generateNonce();
      await account.save();
      
      return nonce;
    } catch (error) {
      console.error('Nonce generation error:', error);
      throw new Error(`Failed to generate nonce: ${error.message}`);
    }
  }

  /**
   * Update an account's last login time
   * @param {String} walletAddress - Ethereum wallet address
   * @returns {Promise<Object>} Update result
   */
  async updateLastLogin(walletAddress) {
    try {
      // Normalize wallet address
      const normalizedAddress = walletAddress.toLowerCase();
      
      // Update the account
      const account = await this.model.findOneAndUpdate(
        { walletAddress: normalizedAddress },
        { lastLogin: new Date() },
        { new: true }
      );
      
      if (!account) {
        throw new Error('Account not found');
      }
      
      return account;
    } catch (error) {
      console.error('Last login update error:', error);
      throw new Error(`Failed to update last login: ${error.message}`);
    }
  }

  /**
   * Update or create an account profile
   * @param {String} walletAddress - Ethereum wallet address
   * @param {Object} profileData - Profile data to update
   * @param {Object} options - Options (see BaseStorage.update)
   * @returns {Promise<Object>} The updated account
   */
  async updateProfile(walletAddress, profileData, options = {}) {
    try {
      // Normalize wallet address
      const normalizedAddress = walletAddress.toLowerCase();
      
      // Find the account
      const account = await this.model.findOne({ walletAddress: normalizedAddress });
      
      if (!account) {
        throw new Error('Account not found');
      }
      
      // Filter out non-profile fields
      const allowedProfileFields = [
        'fullName', 'bio', 'avatarUrl', 'coverImageUrl', 
        'socialLinks', 'preferences', 'customFields'
      ];
      
      const filteredData = Object.keys(profileData)
        .filter(key => allowedProfileFields.includes(key))
        .reduce((obj, key) => {
          obj[key] = profileData[key];
          return obj;
        }, {});
      
      // Update the account with profile data
      Object.assign(account, filteredData);
      
      // Save the updated account
      await account.save();
      
      // Verify on blockchain if requested
      if (options.verify !== false) {
        await this.verify(account._id, options.account);
      }
      
      return account;
    } catch (error) {
      console.error('Profile update error:', error);
      throw new Error(`Failed to update profile: ${error.message}`);
    }
  }

  /**
   * Update account preferences
   * @param {String} walletAddress - Ethereum wallet address
   * @param {Object} preferences - New preferences
   * @param {Object} options - Options (see BaseStorage.update)
   * @returns {Promise<Object>} The updated account
   */
  async updatePreferences(walletAddress, preferences, options = {}) {
    try {
      // Normalize wallet address
      const normalizedAddress = walletAddress.toLowerCase();
      
      // Find the account
      const account = await this.model.findOne({ walletAddress: normalizedAddress });
      
      if (!account) {
        throw new Error('Account not found');
      }
      
      // Update preferences
      account.preferences = {
        ...account.preferences,
        ...preferences
      };
      
      // Save and verify
      await account.save();
      
      // Verify on blockchain if requested
      if (options.verify !== false) {
        await this.verify(account._id, options.account);
      }
      
      return account;
    } catch (error) {
      console.error('Preferences update error:', error);
      throw new Error(`Failed to update account preferences: ${error.message}`);
    }
  }

  /**
   * Get public profile information
   * @param {String} walletAddressOrUsername - Wallet address or username
   * @returns {Promise<Object>} Public profile information
   */
  async getPublicProfile(walletAddressOrUsername) {
    try {
      let account;
      
      // Check if input looks like a wallet address
      if (walletAddressOrUsername.startsWith('0x')) {
        const normalizedAddress = walletAddressOrUsername.toLowerCase();
        account = await this.model.findOne({ walletAddress: normalizedAddress });
      } else {
        // Otherwise, treat as username
        account = await this.model.findOne({ username: walletAddressOrUsername });
      }
      
      if (!account) {
        return null;
      }
      
      // Return public profile data
      return account.getPublicProfile();
    } catch (error) {
      console.error('Public profile retrieval error:', error);
      throw new Error(`Failed to get public profile: ${error.message}`);
    }
  }
}

// Export singleton instance
module.exports = new AccountStorage();