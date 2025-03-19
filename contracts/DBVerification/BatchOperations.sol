// file: contracts/DBVerification/BatchOperations.sol
// description: Implementation with batch operations and utility functions
// module: Contract
// License: MIT
// Author: Andrew Donelson
// Copyright 2025 Andrew Donelson
// SPDX-License-Identifier: UNLICENSED

pragma solidity >=0.7.0 <0.9.0;
pragma abicoder v2;

import "./BytesOperations.sol";

/**
 * @title BatchOperations
 * @dev Final implementation with batch operations and utility functions
 */
contract BatchOperations is BytesOperations {
    /**
     * @dev Verifies if a provided data hash matches the stored hash (bytes32 key version)
     * @param tableId The database table/collection identifier
     * @param recordId The record identifier within the table/collection
     * @param dataHash The hash to verify against the stored hash
     * @return bool True if the hashes match
     */
    function verifyRecordHashBytes32(bytes32 tableId, bytes32 recordId, bytes32 dataHash) 
        external 
        view 
        override 
        returns (bool) 
    {
        bytes32 key = generateBytes32Key(tableId, recordId);
        return bytes32KeyHashes[key] == dataHash;
    }
    
    /**
     * @dev Checks if a record exists (bytes32 key version)
     * @param tableId The database table/collection identifier
     * @param recordId The record identifier within the table/collection
     * @return bool True if the record exists
     */
    function recordExistsBytes32(bytes32 tableId, bytes32 recordId) 
        external 
        view 
        override 
        returns (bool) 
    {
        bytes32 key = generateBytes32Key(tableId, recordId);
        return bytes32KeyHashes[key] != bytes32(0);
    }
    
    /**
     * @dev Checks if a record is archived (bytes32 key version)
     * @param tableId The database table/collection identifier
     * @param recordId The record identifier within the table/collection
     * @return bool True if the record is archived
     */
    function isRecordArchivedBytes32(bytes32 tableId, bytes32 recordId) 
        external 
        view 
        override 
        returns (bool) 
    {
        bytes32 key = generateBytes32Key(tableId, recordId);
        return bytes32KeyMetadata[key].isArchived;
    }
    
    /**
     * @dev Updates multiple record hashes in a single transaction (string key version)
     * @param batchId A unique identifier for this batch operation
     * @param tableIds Array of table identifiers
     * @param recordIds Array of record identifiers
     * @param hashes Array of hashes
     */
    function updateBatchRecordHashes(
        bytes32 batchId,
        string[] calldata tableIds,
        string[] calldata recordIds,
        bytes32[] calldata hashes
    ) external override onlyOwnerOrAdmin {
        require(tableIds.length == recordIds.length && recordIds.length == hashes.length, 
            "DBVerification: arrays must have the same length");
        require(tableIds.length > 0, "DBVerification: batch cannot be empty");
        require(!batchVerifications[batchId], "DBVerification: batchId already used");
        
        for (uint i = 0; i < tableIds.length; i++) {
            bytes32 key = generateStringKey(tableIds[i], recordIds[i]);
            
            // Update metadata
            RecordMetadata storage metadata = stringKeyMetadata[key];
            if (stringKeyHashes[key] == bytes32(0)) {
                metadata.updateCount = 1;
                metadata.revision = 1;
            } else if (!metadata.isArchived) {
                metadata.updateCount += 1;
                metadata.revision += 1;
            } else {
                continue; // Skip archived records
            }
            
            metadata.timestamp = block.timestamp;
            metadata.updatedBy = msg.sender;
            metadata.isArchived = false;
            
            // Store hash
            stringKeyHashes[key] = hashes[i];
            
            // Individual events are not emitted to save gas
            // Users can query the contract to get the latest revision
        }
        
        // Mark this batch as processed
        batchVerifications[batchId] = true;
        
        // Emit batch event
        emit BatchHashesUpdated(batchId, tableIds.length, block.timestamp);
    }
    
    /**
     * @dev Updates multiple record hashes in a single transaction (bytes32 key version)
     * @param batchId A unique identifier for this batch operation
     * @param tableIds Array of table identifiers
     * @param recordIds Array of record identifiers
     * @param hashes Array of hashes
     */
    function updateBatchRecordHashesBytes32(
        bytes32 batchId,
        bytes32[] calldata tableIds,
        bytes32[] calldata recordIds,
        bytes32[] calldata hashes
    ) external override onlyOwnerOrAdmin {
        require(tableIds.length == recordIds.length && recordIds.length == hashes.length, 
            "DBVerification: arrays must have the same length");
        require(tableIds.length > 0, "DBVerification: batch cannot be empty");
        require(!batchVerifications[batchId], "DBVerification: batchId already used");
        
        for (uint i = 0; i < tableIds.length; i++) {
            bytes32 key = generateBytes32Key(tableIds[i], recordIds[i]);
            
            // Update metadata
            RecordMetadata storage metadata = bytes32KeyMetadata[key];
            if (bytes32KeyHashes[key] == bytes32(0)) {
                metadata.updateCount = 1;
                metadata.revision = 1;
            } else if (!metadata.isArchived) {
                metadata.updateCount += 1;
                metadata.revision += 1;
            } else {
                continue; // Skip archived records
            }
            
            metadata.timestamp = block.timestamp;
            metadata.updatedBy = msg.sender;
            metadata.isArchived = false;
            
            // Store hash
            bytes32KeyHashes[key] = hashes[i];
            
            // Individual events are not emitted to save gas
            // Users can query the contract to get the latest revision
        }
        
        // Mark this batch as processed
        batchVerifications[batchId] = true;
        
        // Emit batch event
        emit BatchHashesUpdated(batchId, tableIds.length, block.timestamp);
    }
    
    /**
     * @dev Checks if a batch verification has been processed
     * @param batchId The batch identifier
     * @return bool True if the batch has been processed
     */
    function isBatchProcessed(bytes32 batchId) external view override returns (bool) {
        return batchVerifications[batchId];
    }
    
    /**
     * @dev Utility function to compute the hash of data on-chain
     * @param data The data to hash
     * @return The keccak256 hash of the data
     */
    function computeHash(string calldata data) external pure override returns (bytes32) {
        return keccak256(abi.encodePacked(data));
    }
}