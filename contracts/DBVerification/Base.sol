// file: contracts/DBVerification/Base.sol
// description: Implementation of the DB verification system with revisions support
// module: Contract
// License: MIT
// Author: Andrew Donelson
// Copyright 2025 Andrew Donelson
// SPDX-License-Identifier: UNLICENSED

pragma solidity >=0.7.0 <0.9.0;
pragma abicoder v2;

import "./interfaces/IDBVerification.sol";
import "./Storage.sol";

/**
 * @title Base
 * @dev Implementation of the DB verification system with revisions
 * This contract contains the logic and inherits storage from DBVerificationStorage
 */
abstract contract Base is IDBVerification, DBVerificationStorage {
    /**
     * @dev Initialize the implementation (replaces constructor for upgradeable contracts)
     * @param initialOwner The initial owner of the contract
     * @param transferDelay The delay in seconds for ownership transfers
     */
    function initialize(address initialOwner, uint256 transferDelay) public {
        require(owner == address(0), "Already initialized");
        require(initialOwner != address(0), "Owner cannot be zero address");
        owner = initialOwner;
        ownershipTransferDelay = transferDelay;
    }
    
    /**
     * @dev Generates a key from string tableId and recordId (backward compatibility)
     * @param tableId The database table/collection identifier
     * @param recordId The record identifier within the table/collection
     * @return bytes32 The combined key used for storage
     */
    function generateStringKey(string memory tableId, string memory recordId) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(tableId, recordId));
    }
    
    /**
     * @dev Generates a key from bytes32 tableId and recordId (gas optimized)
     * @param tableId The database table/collection identifier
     * @param recordId The record identifier within the table/collection
     * @return bytes32 The combined key used for storage
     */
    function generateBytes32Key(bytes32 tableId, bytes32 recordId) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(tableId, recordId));
    }
    
    /**
     * @dev Modifier to ensure the caller is the owner
     */
    modifier onlyOwner() {
        require(msg.sender == owner, "DBVerification: caller is not the owner");
        _;
    }
    
    /**
     * @dev Modifier to ensure the caller is either the owner or an admin
     */
    modifier onlyOwnerOrAdmin() {
        require(msg.sender == owner || admins[msg.sender], "DBVerification: caller is not authorized");
        _;
    }
    
    /**
     * @dev Modifier to ensure record exists (string key version)
     */
    modifier recordMustExist(string memory tableId, string memory recordId) {
        bytes32 key = generateStringKey(tableId, recordId);
        require(stringKeyHashes[key] != bytes32(0), "DBVerification: record does not exist");
        _;
    }
    
    /**
     * @dev Modifier to ensure record exists (bytes32 key version)
     */
    modifier recordMustExistBytes32(bytes32 tableId, bytes32 recordId) {
        bytes32 key = generateBytes32Key(tableId, recordId);
        require(bytes32KeyHashes[key] != bytes32(0), "DBVerification: record does not exist");
        _;
    }
    
    /**
     * @dev Modifier to ensure record is not archived (string key version)
     */
    modifier recordNotArchived(string memory tableId, string memory recordId) {
        bytes32 key = generateStringKey(tableId, recordId);
        require(!stringKeyMetadata[key].isArchived, "DBVerification: record is archived");
        _;
    }
    
    /**
     * @dev Modifier to ensure record is not archived (bytes32 key version)
     */
    modifier recordNotArchivedBytes32(bytes32 tableId, bytes32 recordId) {
        bytes32 key = generateBytes32Key(tableId, recordId);
        require(!bytes32KeyMetadata[key].isArchived, "DBVerification: record is archived");
        _;
    }
    
    // Ownership management with timelock
    
    /**
     * @dev Initiates the ownership transfer process with timelock
     * @param newOwner The address that will be the new owner
     */
    function initiateOwnershipTransfer(address newOwner) external override onlyOwner {
        require(newOwner != address(0), "DBVerification: new owner is the zero address");
        require(newOwner != owner, "DBVerification: new owner is the current owner");
        
        pendingOwner = newOwner;
        ownershipTransferTime = block.timestamp + ownershipTransferDelay;
        
        emit OwnershipTransferInitiated(owner, newOwner, ownershipTransferTime);
    }
    
    /**
     * @dev Cancels a pending ownership transfer
     */
    function cancelOwnershipTransfer() external override onlyOwner {
        require(pendingOwner != address(0), "DBVerification: no pending ownership transfer");
        
        address oldPendingOwner = pendingOwner;
        pendingOwner = address(0);
        ownershipTransferTime = 0;
        
        emit OwnershipTransferCancelled(owner, oldPendingOwner);
    }
    
    /**
     * @dev Completes the ownership transfer after timelock period
     */
    function completeOwnershipTransfer() external override {
        require(pendingOwner != address(0), "DBVerification: no pending ownership transfer");
        require(block.timestamp >= ownershipTransferTime, "DBVerification: ownership transfer timelock not expired");
        
        address oldOwner = owner;
        owner = pendingOwner;
        pendingOwner = address(0);
        ownershipTransferTime = 0;
        
        emit OwnershipTransferred(oldOwner, owner);
    }
    
    /**
     * @dev Sets the delay for ownership transfers
     * @param delay The new delay in seconds
     */
    function setOwnershipTransferDelay(uint256 delay) external override onlyOwner {
        ownershipTransferDelay = delay;
    }
    
    /**
     * @dev Add a new admin
     * @param admin The address to grant admin privileges
     */
    function addAdmin(address admin) external override onlyOwner {
        require(admin != address(0), "DBVerification: admin is the zero address");
        require(!admins[admin], "DBVerification: account is already an admin");
        
        admins[admin] = true;
        emit AdminAdded(admin, block.timestamp);
    }
    
    /**
     * @dev Remove an admin
     * @param admin The address to revoke admin privileges from
     */
    function removeAdmin(address admin) external override onlyOwner {
        require(admins[admin], "DBVerification: account is not an admin");
        
        admins[admin] = false;
        emit AdminRemoved(admin, block.timestamp);
    }
    
    /**
     * @dev Upgrade the implementation contract
     * @param newImplementation The address of the new implementation
     */
    function upgradeTo(address newImplementation) external override onlyOwner {
        require(newImplementation != address(0), "DBVerification: new implementation is the zero address");
        require(newImplementation != _implementation, "DBVerification: new implementation is the current one");
        
        emit ImplementationUpgraded(_implementation, newImplementation);
        _implementation = newImplementation;
    }
    
    /**
     * @dev Get the current implementation address
     * @return Current implementation address
     */
    function getImplementation() external view override returns (address) {
        return _implementation;
    }
    
    // Legacy string key functions for backward compatibility
    
    /**
     * @dev Updates the hash for a record with string keys
     * @param tableId The database table/collection identifier
     * @param recordId The record identifier within the table/collection
     * @param hash The new hash of the record data
     */
    function updateRecordHash(string calldata tableId, string calldata recordId, bytes32 hash) 
        external 
        override 
        onlyOwnerOrAdmin 
    {
        require(bytes(tableId).length > 0, "DBVerification: tableId cannot be empty");
        require(bytes(recordId).length > 0, "DBVerification: recordId cannot be empty");
        
        bytes32 key = generateStringKey(tableId, recordId);
        
        // Update or initialize record metadata
        RecordMetadata storage metadata = stringKeyMetadata[key];
        if (stringKeyHashes[key] == bytes32(0)) {
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
        stringKeyHashes[key] = hash;
        
        emit HashUpdated(tableId, recordId, hash, metadata.revision, block.timestamp);
    }
}