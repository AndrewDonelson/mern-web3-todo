// file: server/models/Todo.js
// description: MongoDB schema for todo items with blockchain verification
// module: Server
// License: MIT
// Author: Andrew Donelson
// Copyright 2025 Andrew Donelson

const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Todo Schema
 * Stores todo items with full metadata and blockchain verification
 */
const TodoSchema = new Schema({
  // Owner's wallet address (links to User model)
  ownerAddress: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  
  // Core todo fields
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  
  description: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  
  completed: {
    type: Boolean,
    default: false
  },
  
  // Smart contract information
  // Reference to the on-chain task if applicable
  contractInfo: {
    taskId: {
      type: Number
    },
    transactionHash: {
      type: String,
      trim: true
    },
    blockNumber: {
      type: Number
    }
  },
  
  // Category information
  category: {
    type: String,
    trim: true,
    default: 'general'
  },
  
  // Priority level
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  
  // Dates
  dueDate: {
    type: Date
  },
  
  completedAt: {
    type: Date
  },
  
  // Tags for filtering/searching
  tags: [{
    type: String,
    trim: true
  }],
  
  // Collaborators (for shared todos)
  collaborators: [{
    address: {
      type: String,
      lowercase: true,
      trim: true
    },
    permissions: {
      type: String,
      enum: ['read', 'write', 'admin'],
      default: 'read'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Attachments (could be IPFS hashes if using decentralized storage)
  attachments: [{
    name: {
      type: String,
      trim: true
    },
    url: {
      type: String,
      trim: true
    },
    contentType: {
      type: String,
      trim: true
    },
    size: {
      type: Number
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // History of changes
  history: [{
    field: {
      type: String,
      required: true
    },
    oldValue: {
      type: Schema.Types.Mixed
    },
    newValue: {
      type: Schema.Types.Mixed
    },
    changedBy: {
      type: String, // wallet address
      required: true
    },
    changedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
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
  
  // Status flag
  isArchived: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for owner reference
TodoSchema.virtual('owner', {
  ref: 'User',
  localField: 'ownerAddress',
  foreignField: 'walletAddress',
  justOne: true
});

// Indexes for efficient queries
TodoSchema.index({ ownerAddress: 1, createdAt: -1 });
TodoSchema.index({ ownerAddress: 1, completed: 1 });
TodoSchema.index({ ownerAddress: 1, isArchived: 1 });
TodoSchema.index({ ownerAddress: 1, dueDate: 1 });
TodoSchema.index({ ownerAddress: 1, category: 1 });
TodoSchema.index({ ownerAddress: 1, priority: 1 });
TodoSchema.index({ 'collaborators.address': 1 });
TodoSchema.index({ tags: 1 });

// Method to generate verification data for blockchain
TodoSchema.methods.generateVerificationData = function() {
  // Create a deterministic representation of critical fields
  const verificationData = {
    id: this._id.toString(),
    ownerAddress: this.ownerAddress,
    title: this.title,
    description: this.description,
    completed: this.completed,
    priority: this.priority,
    category: this.category,
    dueDate: this.dueDate ? this.dueDate.toISOString() : null,
    completedAt: this.completedAt ? this.completedAt.toISOString() : null,
    collaborators: this.collaborators.map(c => `${c.address}:${c.permissions}`).sort(),
    contractInfo: this.contractInfo
  };
  
  // Sort keys for deterministic JSON stringification
  return JSON.stringify(verificationData, Object.keys(verificationData).sort());
};

// Method to add a history entry
TodoSchema.methods.addHistoryEntry = function(field, oldValue, newValue, changedBy) {
  if (!this.history) {
    this.history = [];
  }
  
  this.history.push({
    field,
    oldValue,
    newValue,
    changedBy,
    changedAt: new Date()
  });
};

// Pre-save middleware to populate history
TodoSchema.pre('save', function(next) {
  if (this.isNew) {
    // Don't track history for new documents
    return next();
  }
  
  // Get the original document from the database
  mongoose.model('Todo').findById(this._id)
    .then(originalDoc => {
      if (!originalDoc) {
        return next();
      }
      
      // Track changes to important fields
      const fieldsToTrack = ['title', 'description', 'completed', 'priority', 'category', 'dueDate'];
      
      fieldsToTrack.forEach(field => {
        const oldValue = originalDoc[field];
        const newValue = this[field];
        
        // Only add history entry if the field has changed
        if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
          this.addHistoryEntry(field, oldValue, newValue, this.ownerAddress);
        }
      });
      
      next();
    })
    .catch(err => next(err));
});

// Static method for finding todos by owner address
TodoSchema.statics.findByOwner = function(ownerAddress, includeArchived = false) {
  const query = { 
    ownerAddress: ownerAddress.toLowerCase()
  };
  
  if (!includeArchived) {
    query.isArchived = { $ne: true };
  }
  
  return this.find(query).sort({ createdAt: -1 });
};

// Static method for finding todos by collaborator
TodoSchema.statics.findByCollaborator = function(collaboratorAddress, includeArchived = false) {
  const query = { 
    'collaborators.address': collaboratorAddress.toLowerCase()
  };
  
  if (!includeArchived) {
    query.isArchived = { $ne: true };
  }
  
  return this.find(query).sort({ createdAt: -1 });
};

const Todo = mongoose.model('Todo', TodoSchema);

module.exports = Todo;