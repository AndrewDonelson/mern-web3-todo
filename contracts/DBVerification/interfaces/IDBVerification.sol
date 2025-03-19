// file: contracts/DBVerification/interfaces/IDBVerification.sol
// description: Interface for the DB verification system
// module: Contract
// License: MIT
// Author: Andrew Donelson
// Copyright 2025 Andrew Donelson
// SPDX-License-Identifier: UNLICENSED

pragma solidity >=0.7.0 <0.9.0;
pragma abicoder v2;

/**
 * @title IDBVerification
 * @dev Interface for the DB verification system
 * Defines all functions and events for both string and bytes32 key versions
 */
interface IDBVerification {
    // Events
    event HashUpdated(string indexed tableId, string indexed recordId, bytes32 hash, uint256 revision, uint256 timestamp);
    event HashUpdatedBytes32(bytes32 indexed tableId, bytes32 indexed recordId, bytes32 hash, uint256 revision, uint256 timestamp);
    event HashArchived(string indexed tableId, string indexed recordId, uint256 timestamp);
    event HashArchivedBytes32(bytes32 indexed tableId, bytes32 indexed recordId, uint256 timestamp);
    event HashRestored(string indexed tableId, string indexed recordId, uint256 timestamp);
    event HashRestoredBytes32(bytes32 indexed tableId, bytes32 indexed recordId, uint256 timestamp);
    event HashDeleted(string indexed tableId, string indexed recordId, uint256 timestamp);
    event HashDeletedBytes32(bytes32 indexed tableId, bytes32 indexed recordId, uint256 timestamp);
    event BatchHashesUpdated(bytes32 indexed batchId, uint256 count, uint256 timestamp);
    event AdminAdded(address indexed admin, uint256 timestamp);
    event AdminRemoved(address indexed admin, uint256 timestamp);
    event OwnershipTransferInitiated(address indexed currentOwner, address indexed pendingOwner, uint256 effectiveTime);
    event OwnershipTransferCancelled(address indexed currentOwner, address indexed pendingOwner);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event ImplementationUpgraded(address indexed previousImplementation, address indexed newImplementation);
    
    // Structs
    struct RecordMetadata {
        uint256 timestamp;     // When the hash was last updated
        address updatedBy;     // Who updated the hash
        uint256 updateCount;   // Number of times the hash has been updated
        uint256 revision;      // Current revision number
        bool isArchived;       // Whether the record is archived
    }
    
    // Admin management functions
    function initiateOwnershipTransfer(address newOwner) external;
    function cancelOwnershipTransfer() external;
    function completeOwnershipTransfer() external;
    function setOwnershipTransferDelay(uint256 delay) external;
    function addAdmin(address admin) external;
    function removeAdmin(address admin) external;
    
    // Upgrade functions
    function upgradeTo(address newImplementation) external;
    
    // Legacy string key functions (backward compatibility)
    function updateRecordHash(string calldata tableId, string calldata recordId, bytes32 hash) external;
    function archiveRecord(string calldata tableId, string calldata recordId) external;
    function restoreRecord(string calldata tableId, string calldata recordId) external;
    function deleteRecordHash(string calldata tableId, string calldata recordId) external;
    function getRecordHash(string calldata tableId, string calldata recordId) external view returns (bytes32);
    function getRecordMetadata(string calldata tableId, string calldata recordId) 
        external view returns (uint256 timestamp, address updatedBy, uint256 updateCount, uint256 revision, bool isArchived);
    function verifyRecordHash(string calldata tableId, string calldata recordId, bytes32 dataHash) external view returns (bool);
    function verifyRecordData(string calldata tableId, string calldata recordId, string calldata data) external view returns (bool);
    function recordExists(string calldata tableId, string calldata recordId) external view returns (bool);
    function isRecordArchived(string calldata tableId, string calldata recordId) external view returns (bool);
    
    // Optimized bytes32 key functions
    function updateRecordHashBytes32(bytes32 tableId, bytes32 recordId, bytes32 hash) external;
    function archiveRecordBytes32(bytes32 tableId, bytes32 recordId) external;
    function restoreRecordBytes32(bytes32 tableId, bytes32 recordId) external;
    function deleteRecordHashBytes32(bytes32 tableId, bytes32 recordId) external;
    function getRecordHashBytes32(bytes32 tableId, bytes32 recordId) external view returns (bytes32);
    function getRecordMetadataBytes32(bytes32 tableId, bytes32 recordId) 
        external view returns (uint256 timestamp, address updatedBy, uint256 updateCount, uint256 revision, bool isArchived);
    function verifyRecordHashBytes32(bytes32 tableId, bytes32 recordId, bytes32 dataHash) external view returns (bool);
    function recordExistsBytes32(bytes32 tableId, bytes32 recordId) external view returns (bool);
    function isRecordArchivedBytes32(bytes32 tableId, bytes32 recordId) external view returns (bool);
    
    // Batch operations
    function updateBatchRecordHashes(
        bytes32 batchId,
        string[] calldata tableIds,
        string[] calldata recordIds,
        bytes32[] calldata hashes
    ) external;
    
    function updateBatchRecordHashesBytes32(
        bytes32 batchId,
        bytes32[] calldata tableIds,
        bytes32[] calldata recordIds,
        bytes32[] calldata hashes
    ) external;
    
    // Utility functions
    function computeHash(string calldata data) external pure returns (bytes32);
    function isBatchProcessed(bytes32 batchId) external view returns (bool);
    function getImplementation() external view returns (address);
}