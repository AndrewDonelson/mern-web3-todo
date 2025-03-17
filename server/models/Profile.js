// file: server/models/Profile.js
// description: MongoDB schema for user profiles with extended information
// module: Server
// License: MIT
// Author: Andrew Donelson
// Copyright 2025 Andrew Donelson

const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Profile Schema
 * Contains extended profile information separate from core user account
 * This separation allows for more flexible profile management
 */
const ProfileSchema = new Schema({
  // Reference to wallet address (links to User model)
  walletAddress: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  
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
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for user reference
ProfileSchema.virtual('user', {
  ref: 'User',
  localField: 'walletAddress',
  foreignField: 'walletAddress',
  justOne: true
});

// Indexes
ProfileSchema.index({ walletAddress: 1 });
ProfileSchema.index({ createdAt: 1 });

// Method to generate verification data for blockchain
ProfileSchema.methods.generateVerificationData = function() {
  // Create a deterministic representation of important fields
  const verificationData = {
    walletAddress: this.walletAddress,
    fullName: this.fullName,
    bio: this.bio,
    avatarUrl: this.avatarUrl,
    preferences: this.preferences,
    id: this._id.toString()
  };
  
  // Sort keys for deterministic JSON stringification
  return JSON.stringify(verificationData, Object.keys(verificationData).sort());
};

// Static method to find by wallet address
ProfileSchema.statics.findByWalletAddress = function(walletAddress) {
  return this.findOne({ walletAddress: walletAddress.toLowerCase() });
};

const Profile = mongoose.model('Profile', ProfileSchema);

module.exports = Profile;