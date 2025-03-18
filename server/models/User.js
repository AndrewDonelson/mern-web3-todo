// file: server/models/User.js
// description: MongoDB schema for user accounts with wallet authentication
// module: Server
// License: MIT
// Author: Andrew Donelson
// Copyright 2025 Andrew Donelson

const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
* User Schema
* Stores essential user account information
* Authentication is primarily via Ethereum wallet
*/
const UserSchema = new Schema({
 // Blockchain wallet address (primary identifier)
 walletAddress: {
   type: String,
   required: true,
   unique: true,
   lowercase: true,
   trim: true
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
 
 // Optional metadata
 metadata: {
   type: Map,
   of: Schema.Types.Mixed
 }
}, {
 timestamps: true,
 toJSON: { virtuals: true },
 toObject: { virtuals: true }
});

// Virtual for profile reference
UserSchema.virtual('profile', {
 ref: 'Profile',
 localField: 'walletAddress',
 foreignField: 'walletAddress',
 justOne: true
});

// Indexes - defined only once to avoid duplicates
UserSchema.index({ walletAddress: 1 });
UserSchema.index({ username: 1 });
UserSchema.index({ createdAt: 1 });

// Method to generate a new nonce
UserSchema.methods.generateNonce = function() {
 this.nonce = Math.floor(Math.random() * 1000000).toString();
 return this.nonce;
};

// Method to generate verification data for blockchain
UserSchema.methods.generateVerificationData = function() {
 // Create a deterministic representation of critical fields
 const verificationData = {
   walletAddress: this.walletAddress,
   username: this.username,
   active: this.active,
   id: this._id.toString()
 };
 
 // Sort keys for deterministic JSON stringification
 return JSON.stringify(verificationData, Object.keys(verificationData).sort());
};

// Static method to find by wallet address
UserSchema.statics.findByWalletAddress = function(walletAddress) {
 return this.findOne({ walletAddress: walletAddress.toLowerCase() });
};

const User = mongoose.model('User', UserSchema);

module.exports = User;