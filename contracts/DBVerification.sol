// SPDX-License-Identifier: MIT
// file: contracts/DBVerification.sol
// description: Smart contract for verifying data integrity between MongoDB and blockchain
// module: Contract
// License: MIT
// Author: Andrew Donelson
// Copyright 2025 Andrew Donelson

pragma solidity >=0.7.0 <0.9.0;
pragma abicoder v2;

/**
 * @title DBVerification
 * @dev Provides data verification functionality by storing hashes of off-chain data on the blockchain.
 * This enables validation that off-chain database records haven't been tampered with.
 */
contract DBVerification {
    // Contract owner address
    address public owner;
    
    // Optional secondary administrators
    mapping(address => bool) public admins;
    
    // Record hash storage by tableId and recordId
    mapping(bytes32 => bytes32) private recordHashes;
    
    // Record metadata storage
    mapping(bytes32 => RecordMetadata) private recordMetadata;
    
    // Batch verification tracking
    mapping(bytes32 => bool) public batchVerifications;
    
    // Struct to store metadata about each record
    struct RecordMetadata {
        uint256 timestamp;     // When the hash was last updated
        address updatedBy;     // Who updated the hash
        uint256 updateCount;   // Number of times the hash has been updated
        bool isArchived;       // Whether the record is archived
    }
    
    // Events
    event HashUpdated(string indexed tableId, string indexed recordId, bytes32 hash, uint256 timestamp);
    event HashArchived(string indexed tableId, string indexed recordId, uint256 timestamp);
    event HashRestored(string indexed tableId, string indexed recordId, uint256 timestamp);
    event HashDeleted(string indexed tableId, string indexed recordId, uint256 timestamp);
    event BatchHashesUpdated(bytes32 indexed batchId, uint256 count, uint256 timestamp);
    event AdminAdded(address indexed admin, uint256 timestamp);
    event AdminRemoved(address indexed admin, uint256 timestamp);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    
    // Modifiers
    
    /**
     * @dev Ensures the function is called by the contract owner
     */
    modifier onlyOwner() {
        require(msg.sender == owner, "DBVerification: caller is not the owner");
        _;
    }
    
    /**
     * @dev Ensures the function is called by either the owner or an admin
     */
    modifier onlyOwnerOrAdmin() {
        require(msg.sender == owner || admins[msg.sender], "DBVerification: caller is not authorized");
        _;
    }
    
    /**
     * @dev Ensures record exists
     */
    modifier recordMustExist(string memory tableId, string memory recordId) {
        bytes32 key = generateKey(tableId, recordId);
        require(recordHashes[key] != bytes32(0), "DBVerification: record does not exist");
        _;
    }
    
    /**
     * @dev Ensures record is not archived
     */
    modifier recordNotArchived(string memory tableId, string memory recordId) {
        bytes32 key = generateKey(tableId, recordId);
        require(!recordMetadata[key].isArchived, "DBVerification: record is archived");
        _;
    }

    /**
     * @dev Constructor sets the original owner of the contract
     */
    constructor() {
        owner = msg.sender;
    }
    
    // Key management functions
    
    /**
     * @dev Generates a key from tableId and recordId
     * @param tableId The database table/collection identifier
     * @param recordId The record identifier within the table/collection
     * @return bytes32 The combined key used for storage
     */
    function generateKey(string memory tableId, string memory recordId) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(tableId, recordId));
    }
    
    // Admin management functions
    
    /**
     * @dev Transfers ownership of the contract to a new account
     * @param newOwner The address of the new owner
     */
    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "DBVerification: new owner is the zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
    
    /**
     * @dev Adds a new admin
     * @param admin The address to grant admin privileges
     */
    function addAdmin(address admin) public onlyOwner {
        require(admin != address(0), "DBVerification: admin is the zero address");
        require(!admins[admin], "DBVerification: account is already an admin");
        admins[admin] = true;
        emit AdminAdded(admin, block.timestamp);
    }
    
    /**
     * @dev Removes an admin
     * @param admin The address to revoke admin privileges from
     */
    function removeAdmin(address admin) public onlyOwner {
        require(admins[admin], "DBVerification: account is not an admin");
        admins[admin] = false;
        emit AdminRemoved(admin, block.timestamp);
    }
    
    // Core hash management functions
    
    /**
     * @dev Updates the hash for a record
     * @param tableId The database table/collection identifier
     * @param recordId The record identifier within the table/collection
     * @param hash The new hash of the record data
     */
    function updateRecordHash(string memory tableId, string memory recordId, bytes32 hash) public onlyOwnerOrAdmin {
        require(bytes(tableId).length > 0, "DBVerification: tableId cannot be empty");
        require(bytes(recordId).length > 0, "DBVerification: recordId cannot be empty");
        
        bytes32 key = generateKey(tableId, recordId);
        
        // Update or initialize record metadata
        RecordMetadata storage metadata = recordMetadata[key];
        if (recordHashes[key] == bytes32(0)) {
            // New record
            metadata.updateCount = 1;
        } else {
            // Existing record
            require(!metadata.isArchived, "DBVerification: cannot update archived record");
            metadata.updateCount += 1;
        }
        
        metadata.timestamp = block.timestamp;
        metadata.updatedBy = msg.sender;
        metadata.isArchived = false;
        
        // Store the hash
        recordHashes[key] = hash;
        
        emit HashUpdated(tableId, recordId, hash, block.timestamp);
    }
    
    /**
     * @dev Archives a record (marks as inactive but preserves the hash)
     * @param tableId The database table/collection identifier
     * @param recordId The record identifier within the table/collection
     */
    function archiveRecord(string memory tableId, string memory recordId) 
        public 
        onlyOwnerOrAdmin 
        recordMustExist(tableId, recordId)
        recordNotArchived(tableId, recordId)
    {
        bytes32 key = generateKey(tableId, recordId);
        recordMetadata[key].isArchived = true;
        emit HashArchived(tableId, recordId, block.timestamp);
    }
    
    /**
     * @dev Restores a previously archived record
     * @param tableId The database table/collection identifier
     * @param recordId The record identifier within the table/collection
     */
    function restoreRecord(string memory tableId, string memory recordId) 
        public 
        onlyOwnerOrAdmin 
        recordMustExist(tableId, recordId)
    {
        bytes32 key = generateKey(tableId, recordId);
        require(recordMetadata[key].isArchived, "DBVerification: record is not archived");
        
        recordMetadata[key].isArchived = false;
        emit HashRestored(tableId, recordId, block.timestamp);
    }
    
    /**
     * @dev Permanently deletes a record hash
     * @param tableId The database table/collection identifier
     * @param recordId The record identifier within the table/collection
     */
    function deleteRecordHash(string memory tableId, string memory recordId) 
        public 
        onlyOwnerOrAdmin 
        recordMustExist(tableId, recordId)
    {
        bytes32 key = generateKey(tableId, recordId);
        delete recordHashes[key];
        delete recordMetadata[key];
        emit HashDeleted(tableId, recordId, block.timestamp);
    }
    
    // Batch operations
    
    /**
     * @dev Updates multiple record hashes in a single transaction (gas efficient)
     * @param batchId A unique identifier for this batch operation
     * @param tableIds Array of table identifiers
     * @param recordIds Array of record identifiers
     * @param hashes Array of hashes
     */
    function updateBatchRecordHashes(
        bytes32 batchId,
        string[] memory tableIds,
        string[] memory recordIds,
        bytes32[] memory hashes
    ) public onlyOwnerOrAdmin {
        require(tableIds.length == recordIds.length && recordIds.length == hashes.length, 
            "DBVerification: arrays must have the same length");
        require(tableIds.length > 0, "DBVerification: batch cannot be empty");
        require(!batchVerifications[batchId], "DBVerification: batchId already used");
        
        for (uint i = 0; i < tableIds.length; i++) {
            bytes32 key = generateKey(tableIds[i], recordIds[i]);
            
            // Update metadata
            RecordMetadata storage metadata = recordMetadata[key];
            if (recordHashes[key] == bytes32(0)) {
                metadata.updateCount = 1;
            } else if (!metadata.isArchived) {
                metadata.updateCount += 1;
            } else {
                continue; // Skip archived records
            }
            
            metadata.timestamp = block.timestamp;
            metadata.updatedBy = msg.sender;
            metadata.isArchived = false;
            
            // Store hash
            recordHashes[key] = hashes[i];
            
            // Emit individual updates - commented out to save gas
            // emit HashUpdated(tableIds[i], recordIds[i], hashes[i], block.timestamp);
        }
        
        // Mark this batch as processed
        batchVerifications[batchId] = true;
        
        // Emit batch event
        emit BatchHashesUpdated(batchId, tableIds.length, block.timestamp);
    }
    
    // View functions
    
    /**
     * @dev Retrieves the stored hash for a record
     * @param tableId The database table/collection identifier
     * @param recordId The record identifier within the table/collection
     * @return The stored hash
     */
    function getRecordHash(string memory tableId, string memory recordId) public view returns (bytes32) {
        bytes32 key = generateKey(tableId, recordId);
        return recordHashes[key];
    }
    
    /**
     * @dev Verifies if a provided data hash matches the stored hash
     * @param tableId The database table/collection identifier
     * @param recordId The record identifier within the table/collection
     * @param dataHash The hash to verify against the stored hash
     * @return bool True if the hashes match
     */
    function verifyRecordHash(string memory tableId, string memory recordId, bytes32 dataHash) public view returns (bool) {
        bytes32 key = generateKey(tableId, recordId);
        return recordHashes[key] == dataHash;
    }
    
    /**
     * @dev Verifies if provided data matches the stored hash
     * @param tableId The database table/collection identifier
     * @param recordId The record identifier within the table/collection
     * @param data The data to hash and verify
     * @return bool True if the hash of the data matches the stored hash
     */
    function verifyRecordData(string memory tableId, string memory recordId, string memory data) public view returns (bool) {
        bytes32 key = generateKey(tableId, recordId);
        bytes32 calculatedHash = keccak256(abi.encodePacked(data));
        return recordHashes[key] == calculatedHash;
    }
    
    /**
     * @dev Gets metadata for a record
     * @param tableId The database table/collection identifier
     * @param recordId The record identifier within the table/collection
     * @return timestamp The last update timestamp
     * @return updatedBy The address that last updated the record
     * @return updateCount The number of times the record has been updated
     * @return isArchived Whether the record is archived
     */
    function getRecordMetadata(string memory tableId, string memory recordId) 
        public 
        view 
        returns (uint256 timestamp, address updatedBy, uint256 updateCount, bool isArchived) 
    {
        bytes32 key = generateKey(tableId, recordId);
        RecordMetadata memory metadata = recordMetadata[key];
        return (
            metadata.timestamp,
            metadata.updatedBy,
            metadata.updateCount,
            metadata.isArchived
        );
    }
    
    /**
     * @dev Checks if a record exists
     * @param tableId The database table/collection identifier
     * @param recordId The record identifier within the table/collection
     * @return bool True if the record exists
     */
    function recordExists(string memory tableId, string memory recordId) public view returns (bool) {
        bytes32 key = generateKey(tableId, recordId);
        return recordHashes[key] != bytes32(0);
    }
    
    /**
     * @dev Checks if a record is archived
     * @param tableId The database table/collection identifier
     * @param recordId The record identifier within the table/collection
     * @return bool True if the record is archived
     */
    function isRecordArchived(string memory tableId, string memory recordId) public view returns (bool) {
        bytes32 key = generateKey(tableId, recordId);
        return recordMetadata[key].isArchived;
    }
    
    /**
     * @dev Checks if a batch verification has been processed
     * @param batchId The batch identifier
     * @return bool True if the batch has been processed
     */
    function isBatchProcessed(bytes32 batchId) public view returns (bool) {
        return batchVerifications[batchId];
    }
    
    /**
     * @dev Utility function to compute the hash of data on-chain
     * @param data The data to hash
     * @return The keccak256 hash of the data
     */
    function computeHash(string memory data) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(data));
    }
}