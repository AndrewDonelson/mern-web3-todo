// file: server/services/storage/ProfileStorage.js
// description: Profile storage service with specialized profile-related operations
// module: Server
// License: MIT
// Author: Andrew Donelson
// Copyright 2025 Andrew Donelson

const BaseStorage = require('./BaseStorage');
const { Profile, User } = require('../../models');

/**
 * Profile Storage Service
 * Extends BaseStorage with profile-specific functionality
 */
class ProfileStorage extends BaseStorage {
  constructor() {
    super(Profile, 'profiles');
  }

  /**
   * Find a profile by wallet address
   * @param {String} walletAddress - Ethereum wallet address
   * @param {Object} options - Options (see BaseStorage.findById)
   * @returns {Promise<Object>} The profile document
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
      console.error('Profile find by wallet error:', error);
      throw new Error(`Failed to find profile by wallet address: ${error.message}`);
    }
  }

  /**
   * Create or update a profile for a user
   * @param {String} walletAddress - Ethereum wallet address
   * @param {Object} profileData - Profile data
   * @param {Object} options - Options (see BaseStorage.create)
   * @returns {Promise<Object>} The created or updated profile
   */
  async createOrUpdate(walletAddress, profileData, options = {}) {
    try {
      // Normalize wallet address
      const normalizedAddress = walletAddress.toLowerCase();
      
      // Check if user exists
      const user = await User.findOne({ walletAddress: normalizedAddress });
      if (!user) {
        throw new Error('User not found');
      }
      
      // Check if profile already exists
      const existingProfile = await this.model.findOne({ walletAddress: normalizedAddress });
      
      if (existingProfile) {
        // Update existing profile
        return await this.update(existingProfile._id, profileData, options);
      } else {
        // Create new profile
        return await this.create({
          ...profileData,
          walletAddress: normalizedAddress
        }, options);
      }
    } catch (error) {
      console.error('Profile create/update error:', error);
      throw new Error(`Failed to create/update profile: ${error.message}`);
    }
  }

  /**
   * Get user profile with user details
   * @param {String} walletAddress - Ethereum wallet address
   * @returns {Promise<Object>} Combined user and profile data
   */
  async getFullProfile(walletAddress) {
    try {
      // Normalize wallet address
      const normalizedAddress = walletAddress.toLowerCase();
      
      // Find profile with user populated
      const profile = await this.model.findOne({ walletAddress: normalizedAddress }).populate('user');
      
      if (!profile) {
        // If no profile exists, check if user exists
        const user = await User.findOne({ walletAddress: normalizedAddress });
        
        if (!user) {
          return null;
        }
        
        // Return user data with empty profile
        return {
          user: user,
          profile: null
        };
      }
      
      return {
        user: profile.user,
        profile: profile
      };
    } catch (error) {
      console.error('Full profile retrieval error:', error);
      throw new Error(`Failed to get full profile: ${error.message}`);
    }
  }

  /**
   * Update profile preferences
   * @param {String} walletAddress - Ethereum wallet address
   * @param {Object} preferences - New preferences
   * @param {Object} options - Options (see BaseStorage.update)
   * @returns {Promise<Object>} The updated profile
   */
  async updatePreferences(walletAddress, preferences, options = {}) {
    try {
      // Normalize wallet address
      const normalizedAddress = walletAddress.toLowerCase();
      
      // Find the profile
      const profile = await this.model.findOne({ walletAddress: normalizedAddress });
      
      if (!profile) {
        throw new Error('Profile not found');
      }
      
      // Update preferences
      profile.preferences = {
        ...profile.preferences,
        ...preferences
      };
      
      // Save and verify
      await profile.save();
      
      // Verify on blockchain if requested
      if (options.verify !== false) {
        await this.verify(profile._id, options.account);
      }
      
      return profile;
    } catch (error) {
      console.error('Profile preferences update error:', error);
      throw new Error(`Failed to update profile preferences: ${error.message}`);
    }
  }
}

module.exports = new ProfileStorage();