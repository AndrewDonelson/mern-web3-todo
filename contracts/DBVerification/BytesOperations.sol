// file: contracts/DBVerification/BytesOperations.sol
// description: Implementation with bytes32 key methods for gas optimization
// module: Contract
// License: MIT
// Author: Andrew Donelson
// Copyright 2025 Andrew Donelson
// SPDX-License-Identifier: UNLICENSED

pragma solidity >=0.7.0 <0.9.0;
pragma abicoder v2;

import "./StringOperations.sol";

/**
 * @title BytesOperations
 * @dev Implementation with bytes32 key methods for gas optimization
 */
abstract contract BytesOperations is StringOperations {
    /**
     * @dev Updates the hash for a record with bytes32 keys (gas optimized)
     * @param tableId The database table/collection identifier
     * @param recordId The record identifier within the table/collection
     * @param hash The new hash of the record data
     */
    function updateRecordHashBytes32(bytes32 tableId, bytes32 recordId, bytes32 hash) 
        external 
        override 
        onlyOwnerOrAdmin 
    {
        require(tableId != bytes32(0), "DBVerification: tableId cannot be empty");
        require(recordId != bytes32(0), "DBVerification: recordId cannot be empty");
        
        bytes32 key = generateBytes32Key(tableId, recordId);
        
        // Update or initialize record metadata
        RecordMetadata storage metadata = bytes32KeyMetadata[key];
        if (bytes32KeyHashes[key] == bytes32(0)) {
            // New record
            metadata.updateCount = 1;
            metadata.revision = 1;
        } else {
            // Existing record
            require(!metadata.isArchived, "DBVerification: cannot update archived record");
            metadata.updateCount += 1;
            metadata.revision += 1;
        }
        
        metadata.timestamp = block.timestamp;
        metadata.updatedBy = msg.sender;
        metadata.isArchived = false;
        
        // Store the hash
        bytes32KeyHashes[key] = hash;
        
        emit HashUpdatedBytes32(tableId, recordId, hash, metadata.revision, block.timestamp);
    }
    
    /**
     * @dev Archives a record (bytes32 key version)
     * @param tableId The database table/collection identifier
     * @param recordId The record identifier within the table/collection
     */
    function archiveRecordBytes32(bytes32 tableId, bytes32 recordId) 
        external 
        override 
        onlyOwnerOrAdmin 
        recordMustExistBytes32(tableId, recordId)
        recordNotArchivedBytes32(tableId, recordId)
    {
        bytes32 key = generateBytes32Key(tableId, recordId);
        bytes32KeyMetadata[key].isArchived = true;
        emit HashArchivedBytes32(tableId, recordId, block.timestamp);
    }
    
    /**
     * @dev Restores a previously archived record (bytes32 key version)
     * @param tableId The database table/collection identifier
     * @param recordId The record identifier within the table/collection
     */
    function restoreRecordBytes32(bytes32 tableId, bytes32 recordId) 
        external 
        override 
        onlyOwnerOrAdmin 
        recordMustExistBytes32(tableId, recordId)
    {
        bytes32 key = generateBytes32Key(tableId, recordId);
        require(bytes32KeyMetadata[key].isArchived, "DBVerification: record is not archived");
        
        bytes32KeyMetadata[key].isArchived = false;
        emit HashRestoredBytes32(tableId, recordId, block.timestamp);
    }
    
    /**
     * @dev Permanently deletes a record hash (bytes32 key version)
     * @param tableId The database table/collection identifier
     * @param recordId The record identifier within the table/collection
     */
    function deleteRecordHashBytes32(bytes32 tableId, bytes32 recordId) 
        external 
        override 
        onlyOwnerOrAdmin 
        recordMustExistBytes32(tableId, recordId)
    {
        bytes32 key = generateBytes32Key(tableId, recordId);
        delete bytes32KeyHashes[key];
        delete bytes32KeyMetadata[key];
        emit HashDeletedBytes32(tableId, recordId, block.timestamp);
    }
    
    /**
     * @dev Retrieves the stored hash for a record (bytes32 key version)
     * @param tableId The database table/collection identifier
     * @param recordId The record identifier within the table/collection
     * @return The stored hash
     */
    function getRecordHashBytes32(bytes32 tableId, bytes32 recordId) 
        external 
        view 
        override 
        returns (bytes32) 
    {
        bytes32 key = generateBytes32Key(tableId, recordId);
        return bytes32KeyHashes[key];
    }
    
    /**
     * @dev Gets metadata for a record (bytes32 key version)
     * @param tableId The database table/collection identifier
     * @param recordId The record identifier within the table/collection
     * @return timestamp The last update timestamp
     * @return updatedBy The address that last updated the record
     * @return updateCount The number of times the record has been updated
     * @return revision The current revision number
     * @return isArchived Whether the record is archived
     */
    function getRecordMetadataBytes32(bytes32 tableId, bytes32 recordId) 
        external 
        view 
        override 
        returns (uint256 timestamp, address updatedBy, uint256 updateCount, uint256 revision, bool isArchived) 
    {
        bytes32 key = generateBytes32Key(tableId, recordId);
        RecordMetadata memory metadata = bytes32KeyMetadata[key];
        return (
            metadata.timestamp,
            metadata.updatedBy,
            metadata.updateCount,
            metadata.revision,
            metadata.isArchived
        );
    }
}