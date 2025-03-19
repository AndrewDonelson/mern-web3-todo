// file: contracts/DBVerification/Factory.sol
// description: Factory for deploying DBVerification proxy and implementation
// module: Contract
// License: MIT
// Author: Andrew Donelson
// Copyright 2025 Andrew Donelson
// SPDX-License-Identifier: UNLICENSED

pragma solidity >=0.7.0 <0.9.0;
pragma abicoder v2;

import "./Proxy.sol";
import "./interfaces/IDBVerification.sol";

/**
 * @title Factory
 * @dev Factory for deploying DB verification system with proxy and implementation
 */
contract Factory {
    event ProxyDeployed(address indexed proxy, address indexed implementation, address indexed owner);
    
    /**
     * @dev Deploys a new DBVerification system with proxy and implementation
     * @param implementation The implementation contract address
     * @param owner The initial owner of the system
     * @param transferDelay The delay for ownership transfers
     * @return proxy The address of the deployed proxy
     */
    function deployVerificationSystem(
        address implementation,
        address owner,
        uint256 transferDelay
    ) external returns (address proxy) {
        // Deploy the proxy
        Proxy verificationProxy = new Proxy(
            implementation,
            owner,
            transferDelay
        );
        
        proxy = address(verificationProxy);
        
        // Initialize the implementation through the proxy
        // This is already done in the constructor of the proxy
        
        emit ProxyDeployed(proxy, implementation, owner);
        
        return proxy;
    }
}