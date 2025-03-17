// file: server/services/storage/BaseStorage.js
// description: Base storage service that combines MongoDB and blockchain verification
// module: Server
// License: MIT
// Author: Andrew Donelson
// Copyright 2025 Andrew Donelson

const blockchainVerification = require('../blockchainVerification');

/**
 * Base Storage Service
 * Provides unified CRUD operations with blockchain verification
 */
class BaseStorage {
  /**
   * Create a new BaseStorage instance
   * @param {Model} model - Mongoose model to use
   * @param {String} tableId - Collection/table identifier for blockchain verification
   */
  constructor(model, tableId) {
    this.model = model;
    this.tableId = tableId;
  }

  /**
   * Create a new document with blockchain verification
   * @param {Object} data - Document data
   * @param {Object} options - Options
   * @param {Boolean} options.verify - Whether to verify on blockchain (default: true)
   * @param {String} options.account - Blockchain account to use for verification
   * @returns {Promise<Object>} The created document
   */
  async create(data, options = {}) {
    try {
      // Set defaults
      const { verify = true, account } = options;
      
      // Create the document in MongoDB
      const document = new this.model(data);
      await document.save();
      
      // Verify on blockchain if requested
      if (verify) {
        await blockchainVerification.verifyDocument(document, this.tableId, account);
      }
      
      return document;
    } catch (error) {
      console.error(`${this.tableId} creation error:`, error);
      throw new Error(`Failed to create ${this.tableId}: ${error.message}`);
    }
  }

  /**
   * Find a document by ID
   * @param {String} id - Document ID
   * @param {Object} options - Options
   * @param {Boolean} options.checkIntegrity - Whether to check blockchain integrity (default: false)
   * @param {Boolean} options.populate - Fields to populate (default: [])
   * @returns {Promise<Object>} The document and integrity status if requested
   */
  async findById(id, options = {}) {
    try {
      // Set defaults
      const { checkIntegrity = false, populate = [] } = options;
      
      // Find document in MongoDB
      let query = this.model.findById(id);
      
      // Apply population if requested
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
      
      return {
        document,
        integrity
      };
    } catch (error) {
      console.error(`${this.tableId} find error:`, error);
      throw new Error(`Failed to find ${this.tableId}: ${error.message}`);
    }
  }

  /**
   * Find documents by query
   * @param {Object} query - Query criteria
   * @param {Object} options - Options
   * @param {Boolean} options.checkIntegrity - Whether to check blockchain integrity (default: false)
   * @param {Boolean} options.populate - Fields to populate (default: [])
   * @param {Object} options.sort - Sort criteria (default: { createdAt: -1 })
   * @param {Number} options.limit - Maximum number of results (default: 50)
   * @param {Number} options.skip - Number of results to skip (default: 0)
   * @returns {Promise<Array>} The documents and integrity statuses if requested
   */
  async find(query = {}, options = {}) {
    try {
      // Set defaults
      const {
        checkIntegrity = false,
        populate = [],
        sort = { createdAt: -1 },
        limit = 50,
        skip = 0
      } = options;
      
      // Find documents in MongoDB
      let mongoQuery = this.model.find(query);
      
      // Apply population if requested
      if (populate.length > 0) {
        mongoQuery = mongoQuery.populate(populate);
      }
      
      // Apply sort, limit, and skip
      mongoQuery = mongoQuery.sort(sort).skip(skip).limit(limit);
      
      const documents = await mongoQuery;
      
      // Check integrity if requested
      if (checkIntegrity) {
        const results = [];
        
        for (const document of documents) {
          let integrity = null;
          
          if (document.blockchainVerification?.isVerified) {
            integrity = await blockchainVerification.checkDocumentIntegrity(document, this.tableId);
          }
          
          results.push({
            document,
            integrity
          });
        }
        
        return results;
      }
      
      // Otherwise, just return the documents
      return documents;
    } catch (error) {
      console.error(`${this.tableId} find error:`, error);
      throw new Error(`Failed to find ${this.tableId}s: ${error.message}`);
    }
  }

  /**
   * Update a document with blockchain verification
   * @param {String} id - Document ID
   * @param {Object} updates - Update data
   * @param {Object} options - Options
   * @param {Boolean} options.verify - Whether to verify on blockchain (default: true)
   * @param {String} options.account - Blockchain account to use for verification
   * @returns {Promise<Object>} The updated document
   */
  async update(id, updates, options = {}) {
    try {
      // Set defaults
      const { verify = true, account } = options;
      
      // Find the document
      const document = await this.model.findById(id);
      
      if (!document) {
        throw new Error(`${this.tableId} not found`);
      }
      
      // Apply updates
      Object.keys(updates).forEach(key => {
        document[key] = updates[key];
      });
      
      // Save the document
      await document.save();
      
      // Verify on blockchain if requested
      if (verify) {
        await blockchainVerification.verifyDocument(document, this.tableId, account);
      }
      
      return document;
    } catch (error) {
      console.error(`${this.tableId} update error:`, error);
      throw new Error(`Failed to update ${this.tableId}: ${error.message}`);
    }
  }

  /**
   * Delete a document
   * @param {String} id - Document ID
   * @param {Object} options - Options
   * @param {Boolean} options.removeVerification - Whether to remove blockchain verification (default: true)
   * @param {String} options.account - Blockchain account to use for verification
   * @returns {Promise<Object>} Delete result
   */
  async delete(id, options = {}) {
    try {
      // Set defaults
      const { removeVerification = true, account } = options;
      
      // Find the document
      const document = await this.model.findById(id);
      
      if (!document) {
        throw new Error(`${this.tableId} not found`);
      }
      
      // Remove blockchain verification if requested
      if (removeVerification && document.blockchainVerification?.isVerified) {
        await blockchainVerification.deleteDocumentVerification(document, this.tableId, account);
      }
      
      // Delete the document
      await document.deleteOne();
      
      return { success: true, id };
    } catch (error) {
      console.error(`${this.tableId} deletion error:`, error);
      throw new Error(`Failed to delete ${this.tableId}: ${error.message}`);
    }
  }

  /**
   * Verify a document on the blockchain
   * @param {String} id - Document ID
   * @param {String} account - Blockchain account to use for verification (optional)
   * @returns {Promise<Object>} Verification result
   */
  async verify(id, account) {
    try {
      // Find the document
      const document = await this.model.findById(id);
      
      if (!document) {
        throw new Error(`${this.tableId} not found`);
      }
      
      // Verify on blockchain
      const result = await blockchainVerification.verifyDocument(document, this.tableId, account);
      
      return result;
    } catch (error) {
      console.error(`${this.tableId} verification error:`, error);
      throw new Error(`Failed to verify ${this.tableId}: ${error.message}`);
    }
  }

  /**
   * Check if a document has been tampered with
   * @param {String} id - Document ID
   * @returns {Promise<Object>} Integrity check result
   */
  async checkIntegrity(id) {
    try {
      // Find the document
      const document = await this.model.findById(id);
      
      if (!document) {
        throw new Error(`${this.tableId} not found`);
      }
      
      // Check integrity
      return await blockchainVerification.checkDocumentIntegrity(document, this.tableId);
    } catch (error) {
      console.error(`${this.tableId} integrity check error:`, error);
      throw new Error(`Failed to check ${this.tableId} integrity: ${error.message}`);
    }
  }

  /**
   * Batch verify multiple documents
   * @param {Array<String>} ids - Document IDs
   * @param {String} account - Blockchain account to use for verification (optional)
   * @returns {Promise<Object>} Batch verification result
   */
  async batchVerify(ids, account) {
    try {
      // Find the documents
      const documents = await this.model.find({ _id: { $in: ids } });
      
      if (documents.length === 0) {
        throw new Error(`No ${this.tableId}s found`);
      }
      
      // Verify on blockchain
      const result = await blockchainVerification.verifyDocumentBatch(documents, this.tableId, account);
      
      return result;
    } catch (error) {
      console.error(`${this.tableId} batch verification error:`, error);
      throw new Error(`Failed to batch verify ${this.tableId}s: ${error.message}`);
    }
  }
}

module.exports = BaseStorage;