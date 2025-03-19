// file: contracts/DBVerification/Proxy.sol
// description: Proxy contract for the upgradeable DB verification system
// module: Contract
// License: MIT
// Author: Andrew Donelson
// Copyright 2025 Andrew Donelson
// SPDX-License-Identifier: UNLICENSED

pragma solidity >=0.7.0 <0.9.0;
pragma abicoder v2;

import "./Storage.sol";

/**
 * @title Proxy
 * @dev Proxy contract that delegates calls to the current implementation
 */
contract Proxy is Storage {
    /**
     * @dev Constructor sets initial implementation and owner
     * @param initialImplementation Address of the initial implementation contract
     * @param initialOwner Address of the initial owner
     * @param initialTransferDelay Initial timelock delay for ownership transfers
     */
    constructor(
        address initialImplementation,
        address initialOwner,
        uint256 initialTransferDelay
    ) {
        require(initialImplementation != address(0), "Implementation cannot be zero address");
        require(initialOwner != address(0), "Owner cannot be zero address");
        
        _implementation = initialImplementation;
        owner = initialOwner;
        ownershipTransferDelay = initialTransferDelay;
    }
    
    /**
     * @dev Fallback function that delegates calls to the implementation
     */
    fallback() external payable {
        address implementation = _implementation;
        require(implementation != address(0), "Implementation not set");
        
        assembly {
            // Copy calldata to memory
            calldatacopy(0, 0, calldatasize())
            
            // Delegate call to the implementation
            let result := delegatecall(gas(), implementation, 0, calldatasize(), 0, 0)
            
            // Copy return data to memory
            returndatacopy(0, 0, returndatasize())
            
            // Return or revert based on the delegatecall result
            switch result
            case 0 { revert(0, returndatasize()) }
            default { return(0, returndatasize()) }
        }
    }
    
    /**
     * @dev Receives Ether
     */
    receive() external payable {
        // Receives Ether, mainly for contract upgradeability support
    }
}