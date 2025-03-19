// file: contracts/DBVerification/StringOperations.sol
// description: Implementation with string key methods for data verification
// module: Contract
// License: MIT
// Author: Andrew Donelson
// Copyright 2025 Andrew Donelson
// SPDX-License-Identifier: UNLICENSED

pragma solidity >=0.7.0 <0.9.0;
pragma abicoder v2;

import "./Base.sol";

/**
 * @title StringOperations
 * @dev Implementation with string key methods for data verification
 */
abstract contract StringOperations is Base {
    /**
     * @dev Archives a record (string key version)
     * @param tableId The database table/collection identifier
     * @param recordId The record identifier within the table/collection
     */
    function archiveRecord(string calldata tableId, string calldata recordId) 
        external 
        override 
        onlyOwnerOrAdmin 
        recordMustExist(tableId, recordId)
        recordNotArchived(tableId, recordId)
    {
        bytes32 key = generateStringKey(tableId, recordId);
        stringKeyMetadata[key].isArchived = true;
        emit HashArchived(tableId, recordId, block.timestamp);
    }
    
    /**
     * @dev Restores a previously archived record (string key version)
     * @param tableId The database table/collection identifier
     * @param recordId The record identifier within the table/collection
     */
    function restoreRecord(string calldata tableId, string calldata recordId) 
        external 
        override 
        onlyOwnerOrAdmin 
        recordMustExist(tableId, recordId)
    {
        bytes32 key = generateStringKey(tableId, recordId);
        require(stringKeyMetadata[key].isArchived, "DBVerification: record is not archived");
        
        stringKeyMetadata[key].isArchived = false;
        emit HashRestored(tableId, recordId, block.timestamp);
    }
    
    /**
     * @dev Permanently deletes a record hash (string key version)
     * @param tableId The database table/collection identifier
     * @param recordId The record identifier within the table/collection
     */
    function deleteRecordHash(string calldata tableId, string calldata recordId) 
        external 
        override 
        onlyOwnerOrAdmin 
        recordMustExist(tableId, recordId)
    {
        bytes32 key = generateStringKey(tableId, recordId);
        delete stringKeyHashes[key];
        delete stringKeyMetadata[key];
        emit HashDeleted(tableId, recordId, block.timestamp);
    }
    
    /**
     * @dev Retrieves the stored hash for a record (string key version)
     * @param tableId The database table/collection identifier
     * @param recordId The record identifier within the table/collection
     * @return The stored hash
     */
    function getRecordHash(string calldata tableId, string calldata recordId) 
        external 
        view 
        override 
        returns (bytes32) 
    {
        bytes32 key = generateStringKey(tableId, recordId);
        return stringKeyHashes[key];
    }
    
    /**
     * @dev Gets metadata for a record (string key version)
     * @param tableId The database table/collection identifier
     * @param recordId The record identifier within the table/collection
     * @return timestamp The last update timestamp
     * @return updatedBy The address that last updated the record
     * @return updateCount The number of times the record has been updated
     * @return revision The current revision number
     * @return isArchived Whether the record is archived
     */
    function getRecordMetadata(string calldata tableId, string calldata recordId) 
        external 
        view 
        override 
        returns (uint256 timestamp, address updatedBy, uint256 updateCount, uint256 revision, bool isArchived) 
    {
        bytes32 key = generateStringKey(tableId, recordId);
        RecordMetadata memory metadata = stringKeyMetadata[key];
        return (
            metadata.timestamp,
            metadata.updatedBy,
            metadata.updateCount,
            metadata.revision,
            metadata.isArchived
        );
    }
    
    /**
     * @dev Verifies if a provided data hash matches the stored hash (string key version)
     * @param tableId The database table/collection identifier
     * @param recordId The record identifier within the table/collection
     * @param dataHash The hash to verify against the stored hash
     * @return bool True if the hashes match
     */
    function verifyRecordHash(string calldata tableId, string calldata recordId, bytes32 dataHash) 
        external 
        view 
        override 
        returns (bool) 
    {
        bytes32 key = generateStringKey(tableId, recordId);
        return stringKeyHashes[key] == dataHash;
    }
    
    /**
     * @dev Verifies if provided data matches the stored hash (string key version)
     * @param tableId The database table/collection identifier
     * @param recordId The record identifier within the table/collection
     * @param data The data to hash and verify
     * @return bool True if the hash of the data matches the stored hash
     */
    function verifyRecordData(string calldata tableId, string calldata recordId, string calldata data) 
        external 
        view 
        override 
        returns (bool) 
    {
        bytes32 key = generateStringKey(tableId, recordId);
        bytes32 calculatedHash = keccak256(abi.encodePacked(data));
        return stringKeyHashes[key] == calculatedHash;
    }
    
    /**
     * @dev Checks if a record exists (string key version)
     * @param tableId The database table/collection identifier
     * @param recordId The record identifier within the table/collection
     * @return bool True if the record exists
     */
    function recordExists(string calldata tableId, string calldata recordId) 
        external 
        view 
        override 
        returns (bool) 
    {
        bytes32 key = generateStringKey(tableId, recordId);
        return stringKeyHashes[key] != bytes32(0);
    }
    
    /**
     * @dev Checks if a record is archived (string key version)
     * @param tableId The database table/collection identifier
     * @param recordId The record identifier within the table/collection
     * @return bool True if the record is archived
     */
    function isRecordArchived(string calldata tableId, string calldata recordId) 
        external 
        view 
        override 
        returns (bool) 
    {
        bytes32 key = generateStringKey(tableId, recordId);
        return stringKeyMetadata[key].isArchived;
    }
}