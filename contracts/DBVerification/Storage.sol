// file: contracts/DBVerification/Storage.sol
// description: Storage contract for the upgradeable DB verification system
// module: Contract
// License: MIT
// Author: Andrew Donelson
// Copyright 2025 Andrew Donelson
// SPDX-License-Identifier: UNLICENSED

pragma solidity >=0.7.0 <0.9.0;
pragma abicoder v2;

/**
 * @title Storage
 * @dev Storage contract for the upgradeable DB verification system
 * This contract only defines state variables and is not meant to be used directly.
 */
contract Storage {
    // Contract owner address
    address public owner;
    
    // Implementation address for upgradeability
    address internal _implementation;
    
    // Timelock for ownership transfer
    uint256 public ownershipTransferDelay;
    address public pendingOwner;
    uint256 public ownershipTransferTime;
    
    // Optional secondary administrators
    mapping(address => bool) public admins;
    
    // Enhanced record metadata with revision tracking
    struct RecordMetadata {
        uint256 timestamp;     // When the hash was last updated
        address updatedBy;     // Who updated the hash
        uint256 updateCount;   // Number of times the hash has been updated
        uint256 revision;      // Current revision number
        bool isArchived;       // Whether the record is archived
    }
    
    // Record hash storage by tableId and recordId
    // For string keys (backward compatibility)
    mapping(bytes32 => bytes32) internal stringKeyHashes;
    
    // For bytes32 keys (gas optimization)
    mapping(bytes32 => bytes32) internal bytes32KeyHashes;
    
    // Record metadata storage
    // For string keys (backward compatibility)
    mapping(bytes32 => RecordMetadata) internal stringKeyMetadata;
    
    // For bytes32 keys (gas optimization)
    mapping(bytes32 => RecordMetadata) internal bytes32KeyMetadata;
    
    // Batch verification tracking
    mapping(bytes32 => bool) public batchVerifications;
    
    // Flag to indicate if a tableId+recordId is using bytes32 format
    mapping(bytes32 => bool) internal isBytes32Format;
}