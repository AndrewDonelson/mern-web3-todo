// file: client/src/services/web3.service.ts
// description: Service for handling web3 interactions in the frontend
// module: Client
// License: MIT
// Author: Andrew Donelson
// Copyright 2025 Andrew Donelson

import Web3 from 'web3';
import { Contract } from 'web3-eth-contract';
import { AbiItem } from 'web3-utils';
import { MetaMaskInpageProvider } from "@metamask/providers";

// Import the ABI
import TodoListABI from '../../../build/contracts/TodoList.json';

/**
 * Service for Web3 and blockchain interactions
 */
class Web3Service {
  private web3: Web3 | null = null;
  private accounts: string[] = [];
  private verificationContract: Contract | null = null;
  private accountsChangedListeners: Function[] = [];
  private chainChangedListeners: Function[] = [];
  private connectedCallback: Function | null = null;

  constructor() {
    // Initialize Web3 if provider is available
    this.initialize();
  }

  /**
   * Initialize Web3 connection
   */
  async initialize(): Promise<boolean> {
    if (window.ethereum) {
      try {
        // Create Web3 instance
        this.web3 = new Web3(window.ethereum as any);
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Initialize contract
        this.initializeContract();
        
        return true;
      } catch (error) {
        console.error('Web3 initialization error:', error);
        return false;
      }
    } else {
      console.warn('Web3 provider not found');
      return false;
    }
  }

  /**
   * Set up Ethereum event listeners
   */
  private setupEventListeners(): void {
    if (!window.ethereum) return;

    // Handle accounts changed
    const handleAccountsChanged = (newAccounts: string[]) => {
      this.accounts = newAccounts;
      this.accountsChangedListeners.forEach(listener => listener(newAccounts));
    };

    // Handle chain changed
    const handleChainChanged = (chainId: string) => {
      this.chainChangedListeners.forEach(listener => listener(chainId));
      // Reload page on chain change as recommended by MetaMask
      window.location.reload();
    };

    try {
      // Use type assertion to any to bypass TypeScript checks for the event methods
      // This is safer than trying to create a complex interface that perfectly matches MetaMask's API
      const provider = window.ethereum as any;
      
      if (typeof provider.on === 'function') {
        provider.on('accountsChanged', handleAccountsChanged);
        provider.on('chainChanged', handleChainChanged);
      } else {
        console.warn('Provider does not support events');
      }
    } catch (error) {
      console.error('Failed to set up event listeners:', error);
    }
  }

  /**
   * Initialize verification contract
   */
  private initializeContract(): void {
    if (!this.web3) return;

    const contractAddress = process.env.REACT_APP_VERIFICATION_CONTRACT_ADDRESS;
    
    if (contractAddress) {
      // Cast the ABI to the correct type expected by web3
      this.verificationContract = new this.web3.eth.Contract(
        TodoListABI.abi as AbiItem[],
        contractAddress
      );
    } else {
      console.warn('Verification contract address not configured');
    }
  }

  /**
   * Check if Web3 is available
   * @returns True if Web3 is available
   */
  isWeb3Available(): boolean {
    return !!window.ethereum && !!this.web3;
  }

  /**
   * Connect to the wallet
   * @param callback Optional callback when connected
   * @returns Connected accounts
   */
  async connect(callback?: Function): Promise<string[]> {
    if (!window.ethereum) {
      throw new Error('Web3 provider not available');
    }

    try {
      // Save callback for later use
      if (callback) {
        this.connectedCallback = callback;
      }

      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' }) as string[];
      this.accounts = accounts;

      // Call the callback if provided
      if (this.connectedCallback) {
        this.connectedCallback(accounts);
      }

      return accounts;
    } catch (error) {
      console.error('Error connecting to wallet:', error);
      throw error;
    }
  }

  /**
   * Get connected accounts
   * @returns Array of connected account addresses
   */
  getAccounts(): string[] {
    return this.accounts;
  }

  /**
   * Check if wallet is connected
   * @returns True if connected
   */
  isConnected(): boolean {
    return this.accounts.length > 0;
  }

  /**
   * Sign a message with the connected wallet
   * @param message Message to sign
   * @param address Address to sign with (defaults to first connected account)
   * @returns Signature
   */
  async signMessage(message: string, address?: string): Promise<string> {
    if (!this.web3 || !window.ethereum) {
      throw new Error('Web3 not initialized');
    }

    try {
      const signingAddress = address || this.accounts[0];
      
      if (!signingAddress) {
        throw new Error('No account available for signing');
      }

      // Use personal_sign for better compatibility
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, signingAddress]
      }) as string;

      return signature;
    } catch (error) {
      console.error('Error signing message:', error);
      throw error;
    }
  }

  /**
   * Verify a document's hash on the blockchain
   * @param tableId Table/collection identifier
   * @param recordId Record ID
   * @param data Data to verify
   * @returns Verification result
   */
  async verifyDocumentOnBlockchain(
    tableId: string,
    recordId: string,
    data: string
  ): Promise<{ valid: boolean; storedHash: string; currentHash: string }> {
    if (!this.web3 || !this.verificationContract) {
      throw new Error('Web3 or contract not initialized');
    }

    try {
      // Calculate hash of the data
      const currentHash = this.web3.utils.keccak256(data);
      
      // Get the stored hash from the contract
      const storedHash = await this.verificationContract.methods
        .getRecordHash(tableId, recordId)
        .call();
      
      // Check if the hashes match
      const valid = storedHash === currentHash;
      
      return {
        valid,
        storedHash,
        currentHash
      };
    } catch (error) {
      console.error('Blockchain verification error:', error);
      throw error;
    }
  }

  /**
   * Add account changed listener
   * @param listener Function to call when accounts change
   */
  addAccountsChangedListener(listener: Function): void {
    this.accountsChangedListeners.push(listener);
  }

  /**
   * Remove account changed listener
   * @param listener Function to remove
   */
  removeAccountsChangedListener(listener: Function): void {
    this.accountsChangedListeners = this.accountsChangedListeners.filter(
      l => l !== listener
    );
  }

  /**
   * Add chain changed listener
   * @param listener Function to call when chain changes
   */
  addChainChangedListener(listener: Function): void {
    this.chainChangedListeners.push(listener);
  }

  /**
   * Remove chain changed listener
   * @param listener Function to remove
   */
  removeChainChangedListener(listener: Function): void {
    this.chainChangedListeners = this.chainChangedListeners.filter(
      l => l !== listener
    );
  }

  /**
   * Get the current network ID
   * @returns Network ID
   */
  async getNetworkId(): Promise<number> {
    if (!this.web3) {
      throw new Error('Web3 not initialized');
    }

    return await this.web3.eth.net.getId();
  }

  /**
   * Get the current gas price
   * @returns Gas price in wei
   */
  async getGasPrice(): Promise<string> {
    if (!this.web3) {
      throw new Error('Web3 not initialized');
    }

    return await this.web3.eth.getGasPrice();
  }

  /**
   * Get transaction receipt
   * @param txHash Transaction hash
   * @returns Transaction receipt
   */
  async getTransactionReceipt(txHash: string): Promise<any> {
    if (!this.web3) {
      throw new Error('Web3 not initialized');
    }

    return await this.web3.eth.getTransactionReceipt(txHash);
  }

  /**
   * Get ethereum balance
   * @param address Address to check
   * @returns Balance in wei
   */
  async getBalance(address?: string): Promise<string> {
    if (!this.web3) {
      throw new Error('Web3 not initialized');
    }

    const targetAddress = address || this.accounts[0];
    
    if (!targetAddress) {
      throw new Error('No address provided or connected');
    }

    return await this.web3.eth.getBalance(targetAddress);
  }

  /**
   * Format wei value to ether
   * @param wei Wei value as string
   * @returns Ether value as string
   */
  weiToEther(wei: string): string {
    if (!this.web3) {
      throw new Error('Web3 not initialized');
    }

    return this.web3.utils.fromWei(wei, 'ether');
  }

  /**
   * Format ether value to wei
   * @param ether Ether value as string
   * @returns Wei value as string
   */
  etherToWei(ether: string): string {
    if (!this.web3) {
      throw new Error('Web3 not initialized');
    }

    return this.web3.utils.toWei(ether, 'ether');
  }
}

// Export singleton instance
export const web3Service = new Web3Service();