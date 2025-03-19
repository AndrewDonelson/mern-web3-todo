// file: server/services/blockchainVerification.js
// description: Service for verifying MongoDB documents with the blockchain
// module: Server
// License: MIT
// Author: Andrew Donelson
// Copyright 2025 Andrew Donelson

const Web3 = require('web3');
const DBVerificationABI = require('../contracts/DBVerification.json').abi;

/**
 * Blockchain Verification Service
 * Handles the interaction between MongoDB documents and the blockchain verification contract
 */
class BlockchainVerificationService {
  constructor() {
    // Initialize web3 with the provider from environment variables
    this.web3 = new Web3(process.env.BLOCKCHAIN_URI || 'http://localhost:7545');
    
    // Initialize the contract instance
    this.contract = new this.web3.eth.Contract(
      DBVerificationABI,
      process.env.VERIFICATION_CONTRACT_ADDRESS
    );
    
    // Account to use for transactions (can be overridden in methods)
    this.defaultAccount = process.env.DEFAULT_ACCOUNT;
  }
  
  /**
   * Verify a document on the blockchain
   * @param {Object} document - Mongoose document to verify
   * @param {String} tableId - Collection/table identifier
   * @param {String} [account] - Ethereum account to use (defaults to env var)
   * @returns {Promise<Object>} Verification result
   */
  async verifyDocument(document, tableId, account = this.defaultAccount) {
    try {
      // Ensure the document has a generateVerificationData method
      if (!document.generateVerificationData || typeof document.generateVerificationData !== 'function') {
        throw new Error('Document must implement generateVerificationData method');
      }
      
      const recordId = document._id.toString();
      const verificationData = document.generateVerificationData();
      
      // Generate hash of the document data
      const verificationHash = this.web3.utils.keccak256(verificationData);
      
      // Call the contract to update the record hash
      const receipt = await this.contract.methods.updateRecordHash(
        tableId,
        recordId,
        verificationHash
      ).send({ 
        from: account,
        gas: 200000
      });
      
      // Update the document with verification info
      document.blockchainVerification = {
        isVerified: true,
        lastVerifiedAt: new Date(),
        transactionHash: receipt.transactionHash,
        verificationHash: verificationHash
      };
      
      await document.save();
      
      return {
        success: true,
        transactionHash: receipt.transactionHash,
        verificationHash: verificationHash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      console.error('Blockchain verification error:', error);
      throw new Error(`Failed to verify document: ${error.message}`);
    }
  }
  
  /**
   * Verify a batch of documents on the blockchain (more gas efficient)
   * @param {Array<Object>} documents - Array of mongoose documents to verify
   * @param {String} tableId - Collection/table identifier
   * @param {String} [account] - Ethereum account to use (defaults to env var)
   * @returns {Promise<Object>} Batch verification result
   */
  async verifyDocumentBatch(documents, tableId, account = this.defaultAccount) {
    try {
      // Generate a unique batch ID
      const batchId = this.web3.utils.keccak256(Date.now().toString());
      
      // Prepare arrays for batch update
      const tableIds = [];
      const recordIds = [];
      const hashes = [];
      
      // Process each document
      for (const document of documents) {
        // Ensure the document has a generateVerificationData method
        if (!document.generateVerificationData || typeof document.generateVerificationData !== 'function') {
          throw new Error('Documents must implement generateVerificationData method');
        }
        
        const recordId = document._id.toString();
        const verificationData = document.generateVerificationData();
        const verificationHash = this.web3.utils.keccak256(verificationData);
        
        tableIds.push(tableId);
        recordIds.push(recordId);
        hashes.push(verificationHash);
        
        // Update the document with verification info
        document.blockchainVerification = {
          isVerified: true,
          lastVerifiedAt: new Date(),
          verificationHash: verificationHash
          // Transaction hash will be updated after the batch is processed
        };
      }
      
      // Call the contract to update the record hashes in batch
      const receipt = await this.contract.methods.updateBatchRecordHashes(
        batchId,
        tableIds,
        recordIds,
        hashes
      ).send({
        from: account,
        gas: 500000 // Adjust gas limit based on batch size
      });
      
      // Update all documents with the transaction hash
      for (const document of documents) {
        document.blockchainVerification.transactionHash = receipt.transactionHash;
        await document.save();
      }
      
      return {
        success: true,
        batchId: batchId,
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        count: documents.length
      };
    } catch (error) {
      console.error('Blockchain batch verification error:', error);
      throw new Error(`Failed to verify document batch: ${error.message}`);
    }
  }
  
  /**
   * Check if a document has been tampered with
   * @param {Object} document - Mongoose document to check
   * @param {String} tableId - Collection/table identifier
   * @returns {Promise<Object>} Verification result
   */
  async checkDocumentIntegrity(document, tableId) {
    try {
      const recordId = document._id.toString();
      
      // Generate current hash from document data
      const verificationData = document.generateVerificationData();
      const currentHash = this.web3.utils.keccak256(verificationData);
      
      // Get the stored hash from the blockchain
      const storedHash = await this.contract.methods.getRecordHash(tableId, recordId).call();
      
      // If no hash is stored, the document has not been verified
      if (storedHash === '0x0000000000000000000000000000000000000000000000000000000000000000') {
        return {
          verified: false,
          status: 'NOT_VERIFIED',
          message: 'Document has not been verified on the blockchain'
        };
      }
      
      // Check if the hashes match
      const isValid = storedHash === currentHash;
      
      return {
        verified: true,
        valid: isValid,
        status: isValid ? 'VALID' : 'TAMPERED',
        message: isValid ? 'Document is valid' : 'Document has been tampered with',
        storedHash: storedHash,
        currentHash: currentHash
      };
    } catch (error) {
      console.error('Blockchain integrity check error:', error);
      throw new Error(`Failed to check document integrity: ${error.message}`);
    }
  }
  
  /**
   * Archive a document's verification
   * @param {Object} document - Mongoose document to archive
   * @param {String} tableId - Collection/table identifier
   * @param {String} [account] - Ethereum account to use (defaults to env var)
   * @returns {Promise<Object>} Archive result
   */
  async archiveDocumentVerification(document, tableId, account = this.defaultAccount) {
    try {
      const recordId = document._id.toString();
      
      // Call the contract to archive the record
      const receipt = await this.contract.methods.archiveRecord(
        tableId,
        recordId
      ).send({ 
        from: account,
        gas: 100000
      });
      
      // Update the document
      document.blockchainVerification = {
        ...document.blockchainVerification,
        isVerified: false,
        lastVerifiedAt: new Date()
      };
      
      await document.save();
      
      return {
        success: true,
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      console.error('Blockchain archive error:', error);
      throw new Error(`Failed to archive document verification: ${error.message}`);
    }
  }
  
  /**
   * Delete a document's verification from the blockchain
   * @param {Object} document - Mongoose document to delete verification for
   * @param {String} tableId - Collection/table identifier
   * @param {String} [account] - Ethereum account to use (defaults to env var)
   * @returns {Promise<Object>} Delete result
   */
  async deleteDocumentVerification(document, tableId, account = this.defaultAccount) {
    try {
      const recordId = document._id.toString();
      
      // Call the contract to delete the record
      const receipt = await this.contract.methods.deleteRecordHash(
        tableId,
        recordId
      ).send({ 
        from: account,
        gas: 100000
      });
      
      // Update the document
      document.blockchainVerification = {
        isVerified: false,
        lastVerifiedAt: new Date()
      };
      
      await document.save();
      
      return {
        success: true,
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      console.error('Blockchain verification deletion error:', error);
      throw new Error(`Failed to delete document verification: ${error.message}`);
    }
  }
}

module.exports = new BlockchainVerificationService();