// file: server/routes/account.routes.js
// description: API routes for account management
// module: Server
// License: MIT
// Author: Andrew Donelson
// Copyright 2025 Andrew Donelson

const express = require('express');
const router = express.Router();
const { Account } = require('../models');
const { AccountStorage } = require('../services/storage');

// Auth middleware is removed for this example/test app

/**
 * @route GET /api/accounts
 * @description Get all accounts (public profiles only)
 * @access Public
 */
router.get('/', async (req, res) => {
  try {
    const accounts = await Account.find().select('-__v -nonce -blockchainVerification');
    res.json(accounts.map(account => account.getPublicProfile()));
  } catch (err) {
    console.error('Error fetching accounts:', err);
    res.status(500).json({ message: 'Server error while fetching accounts' });
  }
});

/**
 * @route POST /api/accounts
 * @description Register a new account
 * @access Public
 */
router.post('/', async (req, res) => {
  const { walletAddress, username, fullName } = req.body;
  
  // Validation
  if (!walletAddress || !username) {
    return res.status(400).json({ message: 'Wallet address and username are required' });
  }
  
  try {
    // Use AccountStorage for registration which includes validation
    const newAccount = await AccountStorage.register({
      walletAddress,
      username,
      fullName
    });
    
    // Return sanitized account data
    res.status(201).json(newAccount.getPublicProfile());
  } catch (err) {
    console.error('Error creating account:', err);
    
    // Return user-friendly error messages
    if (err.message.includes('already registered') || err.message.includes('already taken')) {
      return res.status(400).json({ message: err.message });
    }
    
    res.status(500).json({ message: 'Server error while creating account' });
  }
});

/**
 * @route GET /api/accounts/:walletAddress
 * @description Get an account by wallet address
 * @access Public
 */
router.get('/:walletAddress', async (req, res) => {
  try {
    const account = await AccountStorage.findByWalletAddress(req.params.walletAddress);
    
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }
    
    res.json(account.getPublicProfile());
  } catch (err) {
    console.error('Error fetching account:', err);
    res.status(500).json({ message: 'Server error while fetching account' });
  }
});

/**
 * @route PUT /api/accounts/:walletAddress
 * @description Update an account's basic info
 * @access Public (for example app; would be Private in production)
 */
router.put('/:walletAddress', async (req, res) => {
  try {
    // For a real app, you would add authentication here
    // and ensure users can only update their own accounts
    
    // Only allow certain fields to be updated
    const { username, email } = req.body;
    const updateData = {};
    
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    
    // Find the account first
    const account = await AccountStorage.findByWalletAddress(req.params.walletAddress);
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }
    
    const updatedAccount = await AccountStorage.update(account._id, updateData);
    
    res.json(updatedAccount.getPublicProfile());
  } catch (err) {
    console.error('Error updating account:', err);
    
    if (err.message.includes('not found')) {
      return res.status(404).json({ message: err.message });
    }
    
    if (err.message.includes('already taken')) {
      return res.status(400).json({ message: err.message });
    }
    
    res.status(500).json({ message: 'Server error while updating account' });
  }
});

/**
 * @route PUT /api/accounts/:walletAddress/profile
 * @description Update an account's profile information
 * @access Public (for example app; would be Private in production)
 */
router.put('/:walletAddress/profile', async (req, res) => {
  try {
    // For a real app, you would add authentication here
    
    const updatedAccount = await AccountStorage.updateProfile(
      req.params.walletAddress,
      req.body
    );
    
    res.json(updatedAccount.getPublicProfile());
  } catch (err) {
    console.error('Error updating profile:', err);
    
    if (err.message.includes('not found')) {
      return res.status(404).json({ message: err.message });
    }
    
    res.status(500).json({ message: 'Server error while updating profile' });
  }
});

/**
 * @route PUT /api/accounts/:walletAddress/preferences
 * @description Update an account's preferences
 * @access Public (for example app; would be Private in production)
 */
router.put('/:walletAddress/preferences', async (req, res) => {
  try {
    // For a real app, you would add authentication here
    
    const updatedAccount = await AccountStorage.updatePreferences(
      req.params.walletAddress,
      req.body
    );
    
    res.json({
      message: 'Preferences updated successfully',
      preferences: updatedAccount.preferences
    });
  } catch (err) {
    console.error('Error updating preferences:', err);
    
    if (err.message.includes('not found')) {
      return res.status(404).json({ message: err.message });
    }
    
    res.status(500).json({ message: 'Server error while updating preferences' });
  }
});

/**
 * @route GET /api/accounts/:walletAddress/nonce
 * @description Get a nonce for wallet signature (used in authentication)
 * @access Public
 */
router.get('/:walletAddress/nonce', async (req, res) => {
  try {
    const nonce = await AccountStorage.generateNonce(req.params.walletAddress);
    res.json({ nonce });
  } catch (err) {
    console.error('Error generating nonce:', err);
    res.status(500).json({ message: 'Server error while generating nonce' });
  }
});

/**
 * @route DELETE /api/accounts/:walletAddress
 * @description Deactivate an account (not permanent deletion)
 * @access Public (for example app; would be Private in production)
 */
router.delete('/:walletAddress', async (req, res) => {
  try {
    // For a real app, you would add authentication here
    // and ensure users can only deactivate their own accounts
    
    // Find the account first
    const account = await AccountStorage.findByWalletAddress(req.params.walletAddress);
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }
    
    // Deactivate rather than permanently delete
    const deactivatedAccount = await AccountStorage.update(account._id, { active: false });
    
    res.json({ 
      message: 'Account deactivated successfully',
      deactivatedAt: new Date()
    });
  } catch (err) {
    console.error('Error deactivating account:', err);
    
    if (err.message.includes('not found')) {
      return res.status(404).json({ message: err.message });
    }
    
    res.status(500).json({ message: 'Server error while deactivating account' });
  }
});

module.exports = router;