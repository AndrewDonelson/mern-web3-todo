// file: server/models/Account.js
// description: Unified MongoDB schema for user accounts with integrated profile information
// module: Server
// License: MIT
// Author: Andrew Donelson
// Copyright 2025 Andrew Donelson

const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Account Schema
 * Combines essential user account information with profile data
 * Authentication is primarily via Ethereum wallet
 */
const AccountSchema = new Schema({
  // Core Account Information
  // -----------------------
  
  // Blockchain wallet address (primary identifier)
  walletAddress: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  
  // Username (display name)
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  
  // Email (optional)
  email: {
    type: String,
    trim: true,
    lowercase: true,
    sparse: true, // Allows null/undefined but enforces uniqueness if provided
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email address']
  },
  
  // Account status
  active: {
    type: Boolean,
    default: true
  },
  
  // Authentication nonce (used for signature challenges)
  nonce: {
    type: String,
    required: true,
    default: () => Math.floor(Math.random() * 1000000).toString()
  },
  
  // Last login timestamp
  lastLogin: {
    type: Date
  },
  
  // Is the user an admin
  isAdmin: {
    type: Boolean,
    default: false
  },
  
  // Profile Information
  // ------------------
  
  // Full name
  fullName: {
    type: String,
    trim: true
  },
  
  // Bio/About information
  bio: {
    type: String,
    trim: true,
    maxlength: 500
  },
  
  // Avatar/profile picture
  // Could be IPFS hash if using decentralized storage
  avatarUrl: {
    type: String,
    trim: true
  },
  
  // Cover/header image
  coverImageUrl: {
    type: String,
    trim: true
  },
  
  // Social media links
  socialLinks: {
    website: {
      type: String,
      trim: true
    },
    twitter: {
      type: String,
      trim: true
    },
    github: {
      type: String,
      trim: true
    },
    linkedin: {
      type: String,
      trim: true
    },
    // Add other social platforms as needed
  },
  
  // User preferences
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system'
    },
    emailNotifications: {
      type: Boolean,
      default: true
    },
    displayWalletAddress: {
      type: Boolean,
      default: true
    }
  },
  
  // Blockchain verification
  blockchainVerification: {
    isVerified: { 
      type: Boolean, 
      default: false 
    },
    lastVerifiedAt: Date,
    transactionHash: String,
    verificationHash: String
  },
  
  // Custom fields (for extensibility)
  customFields: {
    type: Map,
    of: Schema.Types.Mixed
  },
  
  // Optional metadata (from original User schema)
  metadata: {
    type: Map,
    of: Schema.Types.Mixed
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes - optimized for common queries
AccountSchema.index({ walletAddress: 1 });
AccountSchema.index({ username: 1 });
AccountSchema.index({ email: 1 }, { sparse: true });
AccountSchema.index({ createdAt: 1 });
AccountSchema.index({ 'socialLinks.github': 1 }, { sparse: true });
AccountSchema.index({ 'socialLinks.twitter': 1 }, { sparse: true });

/**
 * Generate a new authentication nonce
 * @returns {string} The new nonce
 */
AccountSchema.methods.generateNonce = function() {
  this.nonce = Math.floor(Math.random() * 1000000).toString();
  return this.nonce;
};

/**
 * Generate verification data for blockchain
 * Creates a deterministic representation of critical fields
 * @returns {string} JSON string of account data for verification
 */
AccountSchema.methods.generateVerificationData = function() {
  // Combine critical fields from both user and profile data
  const verificationData = {
    id: this._id.toString(),
    walletAddress: this.walletAddress,
    username: this.username,
    active: this.active,
    fullName: this.fullName,
    bio: this.bio,
    avatarUrl: this.avatarUrl,
    email: this.email,
    preferences: this.preferences
  };
  
  // Sort keys for deterministic JSON stringification
  return JSON.stringify(verificationData, Object.keys(verificationData).sort());
};

/**
 * Find an account by wallet address
 * @param {string} walletAddress - The wallet address to search for
 * @returns {Promise<Account>} The account document or null
 */
AccountSchema.statics.findByWalletAddress = function(walletAddress) {
  return this.findOne({ walletAddress: walletAddress.toLowerCase() });
};

/**
 * Find an account by username
 * @param {string} username - The username to search for
 * @returns {Promise<Account>} The account document or null
 */
AccountSchema.statics.findByUsername = function(username) {
  return this.findOne({ username: username });
};

/**
 * Find accounts by email
 * @param {string} email - The email to search for
 * @returns {Promise<Account[]>} The account documents or empty array
 */
AccountSchema.statics.findByEmail = function(email) {
  return this.find({ email: email.toLowerCase() });
};

/**
 * Create a basic public profile object with limited information
 * Useful for APIs that need to return user data without sensitive information
 */
AccountSchema.methods.getPublicProfile = function() {
  return {
    id: this._id,
    username: this.username,
    walletAddress: this.walletAddress,
    fullName: this.fullName,
    bio: this.bio,
    avatarUrl: this.avatarUrl,
    coverImageUrl: this.coverImageUrl,
    socialLinks: this.socialLinks,
    isAdmin: this.isAdmin,
    createdAt: this.createdAt
  };
};

/**
 * Middleware: Before saving, ensure wallet address is lowercase
 */
AccountSchema.pre('save', function(next) {
  if (this.isModified('walletAddress')) {
    this.walletAddress = this.walletAddress.toLowerCase();
  }
  next();
});

/**
 * Middleware: Before saving, ensure email is lowercase
 */
AccountSchema.pre('save', function(next) {
  if (this.isModified('email') && this.email) {
    this.email = this.email.toLowerCase();
  }
  next();
});

const Account = mongoose.model('Account', AccountSchema);

module.exports = Account;