// file: server/services/storage/TodoStorage.js
// description: Todo storage service with specialized todo-related operations
// module: Server
// License: MIT
// Author: Andrew Donelson
// Copyright 2025 Andrew Donelson

const BaseStorage = require('./BaseStorage');
const { Todo } = require('../../models');
const blockchainVerification = require('../blockchainVerification');

/**
 * Todo Storage Service
 * Extends BaseStorage with todo-specific functionality
 */
class TodoStorage extends BaseStorage {
  constructor() {
    super(Todo, 'todos');
  }

  /**
   * Find todos owned by a specific wallet address
   * @param {String} walletAddress - Ethereum wallet address
   * @param {Object} options - Options (see BaseStorage.find)
   * @returns {Promise<Array>} The todo documents
   */
  async findByOwner(walletAddress, options = {}) {
    try {
      // Normalize wallet address
      const normalizedAddress = walletAddress.toLowerCase();
      
      // Prepare query with owner address and archived filter
      const query = { 
        ownerAddress: normalizedAddress
      };
      
      // Filter out archived todos by default
      if (options.includeArchived !== true) {
        query.isArchived = { $ne: true };
      }
      
      // Add completed filter if provided
      if (options.completed !== undefined) {
        query.completed = options.completed;
      }
      
      // Add category filter if provided
      if (options.category) {
        query.category = options.category;
      }
      
      // Add priority filter if provided
      if (options.priority) {
        query.priority = options.priority;
      }
      
      // Add tag filter if provided
      if (options.tag) {
        query.tags = options.tag;
      }
      
      // Add text search if provided
      if (options.search) {
        query.$or = [
          { title: { $regex: options.search, $options: 'i' } },
          { description: { $regex: options.search, $options: 'i' } }
        ];
      }
      
      // Find todos
      return await this.find(query, options);
    } catch (error) {
      console.error('Todo find by owner error:', error);
      throw new Error(`Failed to find todos by owner: ${error.message}`);
    }
  }

  /**
   * Find todos where the specified wallet address is a collaborator
   * @param {String} walletAddress - Ethereum wallet address
   * @param {Object} options - Options (see BaseStorage.find)
   * @returns {Promise<Array>} The todo documents
   */
  async findByCollaborator(walletAddress, options = {}) {
    try {
      // Normalize wallet address
      const normalizedAddress = walletAddress.toLowerCase();
      
      // Prepare query with collaborator address
      const query = { 
        'collaborators.address': normalizedAddress
      };
      
      // Filter out archived todos by default
      if (options.includeArchived !== true) {
        query.isArchived = { $ne: true };
      }
      
      // Find todos
      return await this.find(query, options);
    } catch (error) {
      console.error('Todo find by collaborator error:', error);
      throw new Error(`Failed to find todos by collaborator: ${error.message}`);
    }
  }

  /**
   * Create a new todo
   * @param {Object} todoData - Todo data
   * @param {String} ownerAddress - Owner's wallet address
   * @param {Object} options - Options (see BaseStorage.create)
   * @returns {Promise<Object>} The created todo
   */
  async createTodo(todoData, ownerAddress, options = {}) {
    try {
      // Normalize wallet address
      const normalizedAddress = ownerAddress.toLowerCase();
      
      // Create todo with owner address
      return await this.create({
        ...todoData,
        ownerAddress: normalizedAddress
      }, options);
    } catch (error) {
      console.error('Todo creation error:', error);
      throw new Error(`Failed to create todo: ${error.message}`);
    }
  }

  /**
   * Toggle the completed status of a todo
   * @param {String} id - Todo ID
   * @param {String} walletAddress - Requester's wallet address
   * @param {Object} options - Options (see BaseStorage.update)
   * @returns {Promise<Object>} The updated todo
   */
  async toggleCompleted(id, walletAddress, options = {}) {
    try {
      // Find the todo
      const todo = await this.model.findById(id);
      
      if (!todo) {
        throw new Error('Todo not found');
      }
      
      // Check authorization
      const normalizedAddress = walletAddress.toLowerCase();
      const isOwner = todo.ownerAddress === normalizedAddress;
      const isCollaborator = todo.collaborators.some(c => 
        c.address === normalizedAddress && ['write', 'admin'].includes(c.permissions)
      );
      
      if (!isOwner && !isCollaborator) {
        throw new Error('Not authorized to update this todo');
      }
      
      // Toggle completed status
      const updatedTodo = await this.update(id, {
        completed: !todo.completed,
        completedAt: !todo.completed ? new Date() : null
      }, options);
      
      // Add history entry
      updatedTodo.addHistoryEntry(
        'completed',
        todo.completed,
        updatedTodo.completed,
        normalizedAddress
      );
      
      await updatedTodo.save();
      
      return updatedTodo;
    } catch (error) {
      console.error('Todo toggle completed error:', error);
      throw new Error(`Failed to toggle todo completion: ${error.message}`);
    }
  }

  /**
   * Add a collaborator to a todo
   * @param {String} id - Todo ID
   * @param {String} collaboratorAddress - Collaborator's wallet address
   * @param {String} permissions - Collaborator's permissions (read, write, admin)
   * @param {String} ownerAddress - Owner's wallet address
   * @param {Object} options - Options (see BaseStorage.update)
   * @returns {Promise<Object>} The updated todo
   */
  async addCollaborator(id, collaboratorAddress, permissions, ownerAddress, options = {}) {
    try {
      // Find the todo
      const todo = await this.model.findById(id);
      
      if (!todo) {
        throw new Error('Todo not found');
      }
      
      // Check authorization
      const normalizedOwner = ownerAddress.toLowerCase();
      if (todo.ownerAddress !== normalizedOwner) {
        throw new Error('Only the owner can add collaborators');
      }
      
      // Normalize collaborator address
      const normalizedCollaborator = collaboratorAddress.toLowerCase();
      
      // Check if collaborator is already added
      const existingCollaborator = todo.collaborators.find(c => c.address === normalizedCollaborator);
      
      if (existingCollaborator) {
        // Update existing collaborator
        existingCollaborator.permissions = permissions;
      } else {
        // Add new collaborator
        todo.collaborators.push({
          address: normalizedCollaborator,
          permissions,
          addedAt: new Date()
        });
      }
      
      // Save and verify
      await todo.save();
      
      // Verify on blockchain if requested
      if (options.verify !== false) {
        await this.verify(todo._id, options.account);
      }
      
      return todo;
    } catch (error) {
      console.error('Todo add collaborator error:', error);
      throw new Error(`Failed to add collaborator: ${error.message}`);
    }
  }

  /**
   * Remove a collaborator from a todo
   * @param {String} id - Todo ID
   * @param {String} collaboratorAddress - Collaborator's wallet address
   * @param {String} ownerAddress - Owner's wallet address
   * @param {Object} options - Options (see BaseStorage.update)
   * @returns {Promise<Object>} The updated todo
   */
  async removeCollaborator(id, collaboratorAddress, ownerAddress, options = {}) {
    try {
      // Find the todo
      const todo = await this.model.findById(id);
      
      if (!todo) {
        throw new Error('Todo not found');
      }
      
      // Check authorization
      const normalizedOwner = ownerAddress.toLowerCase();
      if (todo.ownerAddress !== normalizedOwner) {
        throw new Error('Only the owner can remove collaborators');
      }
      
      // Normalize collaborator address
      const normalizedCollaborator = collaboratorAddress.toLowerCase();
      
      // Filter out the collaborator
      todo.collaborators = todo.collaborators.filter(c => c.address !== normalizedCollaborator);
      
      // Save and verify
      await todo.save();
      
      // Verify on blockchain if requested
      if (options.verify !== false) {
        await this.verify(todo._id, options.account);
      }
      
      return todo;
    } catch (error) {
      console.error('Todo remove collaborator error:', error);
      throw new Error(`Failed to remove collaborator: ${error.message}`);
    }
  }

  /**
   * Archive a todo
   * @param {String} id - Todo ID
   * @param {String} walletAddress - Requester's wallet address
   * @param {Object} options - Options (see BaseStorage.update)
   * @returns {Promise<Object>} The archived todo
   */
  async archiveTodo(id, walletAddress, options = {}) {
    try {
      // Find the todo
      const todo = await this.model.findById(id);
      
      if (!todo) {
        throw new Error('Todo not found');
      }
      
      // Check authorization
      const normalizedAddress = walletAddress.toLowerCase();
      if (todo.ownerAddress !== normalizedAddress) {
        throw new Error('Only the owner can archive todos');
      }
      
      // Archive todo
      const updatedTodo = await this.update(id, { isArchived: true }, options);
      
      // Also archive on blockchain if requested
      if (options.archiveOnBlockchain !== false && todo.blockchainVerification?.isVerified) {
        await blockchainVerification.archiveDocumentVerification(updatedTodo, this.tableId, options.account);
      }
      
      return updatedTodo;
    } catch (error) {
      console.error('Todo archive error:', error);
      throw new Error(`Failed to archive todo: ${error.message}`);
    }
  }

  /**
   * Restore an archived todo
   * @param {String} id - Todo ID
   * @param {String} walletAddress - Requester's wallet address
   * @param {Object} options - Options (see BaseStorage.update)
   * @returns {Promise<Object>} The restored todo
   */
  async restoreTodo(id, walletAddress, options = {}) {
    try {
      // Find the todo
      const todo = await this.model.findById(id);
      
      if (!todo) {
        throw new Error('Todo not found');
      }
      
      // Check authorization
      const normalizedAddress = walletAddress.toLowerCase();
      if (todo.ownerAddress !== normalizedAddress) {
        throw new Error('Only the owner can restore todos');
      }
      
      // Restore todo
      return await this.update(id, { isArchived: false }, options);
    } catch (error) {
      console.error('Todo restore error:', error);
      throw new Error(`Failed to restore todo: ${error.message}`);
    }
  }

  /**
   * Add a tag to a todo
   * @param {String} id - Todo ID
   * @param {String} tag - Tag to add
   * @param {String} walletAddress - Requester's wallet address
   * @param {Object} options - Options (see BaseStorage.update)
   * @returns {Promise<Object>} The updated todo
   */
  async addTag(id, tag, walletAddress, options = {}) {
    try {
      // Find the todo
      const todo = await this.model.findById(id);
      
      if (!todo) {
        throw new Error('Todo not found');
      }
      
      // Check authorization
      const normalizedAddress = walletAddress.toLowerCase();
      const isOwner = todo.ownerAddress === normalizedAddress;
      const isCollaborator = todo.collaborators.some(c => 
        c.address === normalizedAddress && ['write', 'admin'].includes(c.permissions)
      );
      
      if (!isOwner && !isCollaborator) {
        throw new Error('Not authorized to update this todo');
      }
      
      // Add tag if it doesn't exist
      if (!todo.tags.includes(tag)) {
        todo.tags.push(tag);
        await todo.save();
        
        // Verify on blockchain if requested
        if (options.verify !== false) {
          await this.verify(todo._id, options.account);
        }
      }
      
      return todo;
    } catch (error) {
      console.error('Todo add tag error:', error);
      throw new Error(`Failed to add tag: ${error.message}`);
    }
  }

  /**
   * Remove a tag from a todo
   * @param {String} id - Todo ID
   * @param {String} tag - Tag to remove
   * @param {String} walletAddress - Requester's wallet address
   * @param {Object} options - Options (see BaseStorage.update)
   * @returns {Promise<Object>} The updated todo
   */
  async removeTag(id, tag, walletAddress, options = {}) {
    try {
      // Find the todo
      const todo = await this.model.findById(id);
      
      if (!todo) {
        throw new Error('Todo not found');
      }
      
      // Check authorization
      const normalizedAddress = walletAddress.toLowerCase();
      const isOwner = todo.ownerAddress === normalizedAddress;
      const isCollaborator = todo.collaborators.some(c => 
        c.address === normalizedAddress && ['write', 'admin'].includes(c.permissions)
      );
      
      if (!isOwner && !isCollaborator) {
        throw new Error('Not authorized to update this todo');
      }
      
      // Remove tag
      todo.tags = todo.tags.filter(t => t !== tag);
      await todo.save();
      
      // Verify on blockchain if requested
      if (options.verify !== false) {
        await this.verify(todo._id, options.account);
      }
      
      return todo;
    } catch (error) {
      console.error('Todo remove tag error:', error);
      throw new Error(`Failed to remove tag: ${error.message}`);
    }
  }

  /**
   * Add an attachment to a todo
   * @param {String} id - Todo ID
   * @param {Object} attachment - Attachment details
   * @param {String} walletAddress - Requester's wallet address
   * @param {Object} options - Options (see BaseStorage.update)
   * @returns {Promise<Object>} The updated todo
   */
  async addAttachment(id, attachment, walletAddress, options = {}) {
    try {
      // Find the todo
      const todo = await this.model.findById(id);
      
      if (!todo) {
        throw new Error('Todo not found');
      }
      
      // Check authorization
      const normalizedAddress = walletAddress.toLowerCase();
      const isOwner = todo.ownerAddress === normalizedAddress;
      const isCollaborator = todo.collaborators.some(c => 
        c.address === normalizedAddress && ['write', 'admin'].includes(c.permissions)
      );
      
      if (!isOwner && !isCollaborator) {
        throw new Error('Not authorized to update this todo');
      }
      
      // Add attachment
      todo.attachments.push({
        ...attachment,
        addedAt: new Date()
      });
      
      await todo.save();
      
      // Verify on blockchain if requested
      if (options.verify !== false) {
        await this.verify(todo._id, options.account);
      }
      
      return todo;
    } catch (error) {
      console.error('Todo add attachment error:', error);
      throw new Error(`Failed to add attachment: ${error.message}`);
    }
  }

  /**
   * Remove an attachment from a todo
   * @param {String} id - Todo ID
   * @param {String} attachmentId - ID or name of attachment to remove
   * @param {String} walletAddress - Requester's wallet address
   * @param {Object} options - Options (see BaseStorage.update)
   * @returns {Promise<Object>} The updated todo
   */
  async removeAttachment(id, attachmentId, walletAddress, options = {}) {
    try {
      // Find the todo
      const todo = await this.model.findById(id);
      
      if (!todo) {
        throw new Error('Todo not found');
      }
      
      // Check authorization
      const normalizedAddress = walletAddress.toLowerCase();
      const isOwner = todo.ownerAddress === normalizedAddress;
      const isCollaborator = todo.collaborators.some(c => 
        c.address === normalizedAddress && ['write', 'admin'].includes(c.permissions)
      );
      
      if (!isOwner && !isCollaborator) {
        throw new Error('Not authorized to update this todo');
      }
      
      // Remove attachment by ID or name
      todo.attachments = todo.attachments.filter(a => 
        a._id.toString() !== attachmentId && a.name !== attachmentId
      );
      
      await todo.save();
      
      // Verify on blockchain if requested
      if (options.verify !== false) {
        await this.verify(todo._id, options.account);
      }
      
      return todo;
    } catch (error) {
      console.error('Todo remove attachment error:', error);
      throw new Error(`Failed to remove attachment: ${error.message}`);
    }
  }

  /**
   * Get stats for a user's todos
   * @param {String} walletAddress - Owner's wallet address
   * @returns {Promise<Object>} Todo statistics
   */
  async getTodoStats(walletAddress) {
    try {
      // Normalize wallet address
      const normalizedAddress = walletAddress.toLowerCase();
      
      // Use aggregation pipeline for efficient stats calculation
      const stats = await this.model.aggregate([
        // Match todos for this owner that are not archived
        { $match: { 
          ownerAddress: normalizedAddress,
          isArchived: { $ne: true }
        }},
        // Group and calculate stats
        { $group: {
          _id: null,
          total: { $sum: 1 },
          completed: { $sum: { $cond: ["$completed", 1, 0] } },
          overdue: { $sum: { $cond: [
            { $and: [
              { $ne: ["$completed", true] },
              { $lt: ["$dueDate", new Date()] }
            ]}, 1, 0
          ]}},
          // Track counts by category
          categories: { $push: "$category" },
          // Track counts by priority
          priorities: { $push: "$priority" },
          // Track all tags
          allTags: { $push: "$tags" }
        }},
        // Project and reshape the results
        { $project: {
          _id: 0,
          total: 1,
          completed: 1,
          inProgress: { $subtract: ["$total", "$completed"] },
          overdue: 1,
          completionRate: { 
            $multiply: [
              { $cond: [{ $eq: ["$total", 0] }, 0, { $divide: ["$completed", "$total"] }] },
              100
            ]
          },
          categories: 1,
          priorities: 1,
          allTags: 1
        }}
      ]);
      
      // If no todos found, return empty stats
      if (stats.length === 0) {
        return {
          total: 0,
          completed: 0,
          inProgress: 0,
          overdue: 0,
          completionRate: 0,
          byCategory: {},
          byPriority: {},
          topTags: []
        };
      }
      
      // Process the result
      const result = stats[0];
      
      // Calculate category counts
      const byCategory = {};
      result.categories.forEach(category => {
        byCategory[category] = (byCategory[category] || 0) + 1;
      });
      
      // Calculate priority counts
      const byPriority = {};
      result.priorities.forEach(priority => {
        byPriority[priority] = (byPriority[priority] || 0) + 1;
      });
      
      // Calculate top tags
      const tagCounts = {};
      result.allTags.flat().forEach(tag => {
        if (tag) {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        }
      });
      
      const topTags = Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([tag, count]) => ({ tag, count }));
      
      // Build final stats object
      return {
        total: result.total,
        completed: result.completed,
        inProgress: result.inProgress,
        overdue: result.overdue,
        completionRate: Math.round(result.completionRate * 100) / 100, // Round to 2 decimal places
        byCategory,
        byPriority,
        topTags
      };
    } catch (error) {
      console.error('Todo stats error:', error);
      throw new Error(`Failed to get todo stats: ${error.message}`);
    }
  }
}

module.exports = new TodoStorage();