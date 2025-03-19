// file: client/src/services/web3.service.ts
// description: Service for handling web3 interactions in the frontend
// module: Client
// License: MIT
// Author: Andrew Donelson
// Copyright 2025 Andrew Donelson

import Web3 from 'web3';
import { Contract } from 'web3-eth-contract';
import { AbiItem } from 'web3-utils';

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
  
  // Cache values to reduce RPC calls
  private cachedNetworkId: number | null = null;
  private cachedGasPrice: string | null = null;
  private balanceCache: Record<string, { balance: string, timestamp: number }> = {};
  private lastGasPriceFetch = 0;
  
  // Long cache times to prevent excessive calls
  private readonly NETWORK_CACHE_TIME = 5 * 60 * 1000; // 5 minutes
  private readonly GAS_PRICE_CACHE_TIME = 60 * 1000; // 1 minute
  private readonly BALANCE_CACHE_TIME = 2 * 60 * 1000; // 2 minutes
  
  // Network names for quick lookup
  private networkNamesCache: Record<number, string> = {
    1: 'Ethereum Mainnet',
    3: 'Ropsten Testnet',
    4: 'Rinkeby Testnet',
    5: 'Goerli Testnet',
    42: 'Kovan Testnet',
    56: 'Binance Smart Chain',
    97: 'BSC Testnet',
    137: 'Polygon Mainnet',
    80001: 'Mumbai Testnet',
    1337: 'Local Development Chain',
    31337: 'Hardhat Local',
    11155111: 'Sepolia Testnet'
  };

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
        
        // Check if already connected and update accounts
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' }) as string[];
          if (accounts && accounts.length > 0) {
            this.accounts = accounts;
          }
        } catch (error) {
          console.warn('Failed to check existing accounts:', error);
        }
        
        // Cache the network ID to reduce RPC calls
        try {
          this.cachedNetworkId = await this.web3.eth.net.getId();
        } catch (error) {
          console.warn('Failed to cache network ID:', error);
        }
        
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
      // Clear balance cache when accounts change
      this.balanceCache = {};
      this.accountsChangedListeners.forEach(listener => listener(newAccounts));
      
      // If accounts is empty, user disconnected their wallet
      if (newAccounts.length === 0) {
        console.log('Wallet disconnected');
      }
    };

    // Handle chain changed
    const handleChainChanged = (chainId: string) => {
      // Clear network cache when chain changes
      this.cachedNetworkId = null;
      this.cachedGasPrice = null;
      this.balanceCache = {};
      
      // Notify listeners
      this.chainChangedListeners.forEach(listener => listener(chainId));
      
      // Reload page on chain change as recommended by MetaMask
      window.location.reload();
    };

    try {
      // Use type assertion to any to bypass TypeScript checks for the event methods
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
   * @param contractAddress Address of the contract
   * @param abi Contract ABI
   */
  public initializeContract(contractAddress: string, abi: AbiItem[]): void {
    if (!this.web3) return;
    
    if (contractAddress) {
      this.verificationContract = new this.web3.eth.Contract(
        abi,
        contractAddress
      );
      console.log('Contract initialized at address:', contractAddress);
    } else {
      console.warn('Verification contract address not provided');
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
   * Connect to the wallet and sync with account system
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
    } catch (error: any) {
      console.error('Error connecting to wallet:', error);
      
      // Provide more user-friendly error messages for common errors
      if (error.code === 4001) {
        throw new Error('You rejected the connection request. Please approve the connection to continue.');
      } else if (error.code === -32002) {
        throw new Error('Connection request already pending. Please check your wallet.');
      }
      
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
    } catch (error: any) {
      console.error('Error signing message:', error);
      
      // Provide more user-friendly error messages for common errors
      if (error.code === 4001) {
        throw new Error('You rejected the signature request. Please approve to continue.');
      }
      
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
   * @param forceRefresh Force refresh the network ID from the blockchain
   * @returns Network ID
   */
  async getNetworkId(forceRefresh = false): Promise<number> {
    if (!this.web3) {
      throw new Error('Web3 not initialized');
    }

    // Return cached value if available and not forcing refresh
    if (this.cachedNetworkId !== null && !forceRefresh) {
      return this.cachedNetworkId;
    }

    // Get fresh value from chain and cache it
    try {
      this.cachedNetworkId = await this.web3.eth.net.getId();
      return this.cachedNetworkId;
    } catch (error) {
      console.error('Error getting network ID:', error);
      // Return cached value as fallback if available
      if (this.cachedNetworkId !== null) {
        return this.cachedNetworkId;
      }
      throw error;
    }
  }

  /**
   * Get network name from chain ID
   * @param chainId Chain ID (optional, uses current network if not provided)
   * @param forceRefresh Force refresh the network ID from the blockchain
   * @returns Network name
   */
  async getNetworkName(chainId?: number, forceRefresh = false): Promise<string> {
    if (!this.web3) {
      throw new Error('Web3 not initialized');
    }

    // Get current chainId if not provided
    if (!chainId) {
      try {
        chainId = await this.getNetworkId(forceRefresh);
      } catch (error) {
        console.error('Error getting network ID for name:', error);
        return 'Unknown Network';
      }
    }

    // Return from cache
    return this.networkNamesCache[chainId] || `Unknown Network (${chainId})`;
  }

  /**
   * Check if connected to the expected network
   * @param expectedNetworkId Expected network ID
   * @returns True if connected to the expected network
   */
  async isCorrectNetwork(expectedNetworkId: number): Promise<boolean> {
    try {
      const currentNetworkId = await this.getNetworkId();
      return currentNetworkId === expectedNetworkId;
    } catch (error) {
      console.error('Error checking network:', error);
      return false;
    }
  }

  /**
   * Get the current gas price
   * @param forceRefresh Force refresh the gas price from the blockchain
   * @returns Gas price in wei
   */
  async getGasPrice(forceRefresh = false): Promise<string> {
    if (!this.web3) {
      throw new Error('Web3 not initialized');
    }

    // Return cached value if available and not forcing refresh
    const now = Date.now();
    
    if (this.cachedGasPrice && !forceRefresh && 
        (now - this.lastGasPriceFetch < this.GAS_PRICE_CACHE_TIME)) {
      return this.cachedGasPrice;
    }

    // Get fresh value from chain
    try {
      this.cachedGasPrice = await this.web3.eth.getGasPrice();
      this.lastGasPriceFetch = now;
      return this.cachedGasPrice;
    } catch (error) {
      console.error('Error getting gas price:', error);
      // Return cached value as fallback if available
      if (this.cachedGasPrice) {
        return this.cachedGasPrice;
      }
      throw error;
    }
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
   * @param forceRefresh Force refresh the balance from the blockchain
   * @returns Balance in wei
   */
  async getBalance(address?: string, forceRefresh = false): Promise<string> {
    if (!this.web3) {
      throw new Error('Web3 not initialized');
    }

    const targetAddress = address || this.accounts[0];
    
    if (!targetAddress) {
      throw new Error('No address provided or connected');
    }

    // Use cached balance if available and less than cache time old
    const now = Date.now();
    
    if (!forceRefresh && 
        this.balanceCache[targetAddress] &&
        (now - this.balanceCache[targetAddress].timestamp < this.BALANCE_CACHE_TIME)) {
      return this.balanceCache[targetAddress].balance;
    }

    // Get fresh balance from chain
    try {
      const balance = await this.web3.eth.getBalance(targetAddress);
      
      // Cache the balance
      this.balanceCache[targetAddress] = {
        balance,
        timestamp: now
      };
      
      return balance;
    } catch (error) {
      console.error('Error getting balance:', error);
      // Return cached value as fallback if available
      if (this.balanceCache[targetAddress]) {
        return this.balanceCache[targetAddress].balance;
      }
      throw error;
    }
  }

  /**
   * Calculate gas cost in native currency
   * @param gasLimit Estimated gas limit
   * @returns Cost in wei
   */
  async calculateGasCost(gasLimit: number): Promise<string> {
    if (!this.web3) {
      throw new Error('Web3 not initialized');
    }

    const gasPrice = await this.getGasPrice();
    return (BigInt(gasPrice) * BigInt(gasLimit)).toString();
  }

  /**
   * Wait for a transaction to be confirmed
   * @param txHash Transaction hash
   * @param confirmations Number of confirmations to wait for (default: 1)
   * @returns Transaction receipt
   */
  async waitForTransaction(txHash: string, confirmations: number = 1): Promise<any> {
    if (!this.web3) {
      throw new Error('Web3 not initialized');
    }

    return new Promise((resolve, reject) => {
      const checkReceipt = async () => {
        try {
          const receipt = await this.web3!.eth.getTransactionReceipt(txHash);
          
          if (!receipt) {
            // Transaction not yet mined
            setTimeout(checkReceipt, 2000);
            return;
          }
          
          if (receipt.status) {
            // Transaction successful
            if (confirmations <= 1) {
              resolve(receipt);
            } else {
              // Wait for additional confirmations
              const currentBlock = await this.web3!.eth.getBlockNumber();
              const confirmationBlocks = currentBlock - receipt.blockNumber;
              
              if (confirmationBlocks >= confirmations) {
                resolve(receipt);
              } else {
                setTimeout(checkReceipt, 2000);
              }
            }
          } else {
            // Transaction failed
            reject(new Error(`Transaction failed: ${txHash}`));
          }
        } catch (error) {
          console.error('Error checking transaction receipt:', error);
          setTimeout(checkReceipt, 2000);
        }
      };
      
      checkReceipt();
    });
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

  /**
   * Format balance to a human-readable string
   * @param balance Balance in wei
   * @param decimals Number of decimal places to display (default: 4)
   * @returns Formatted balance string with ETH suffix
   */
  formatBalance(balance: string, decimals: number = 4): string {
    if (!this.web3) {
      throw new Error('Web3 not initialized');
    }

    try {
      const ether = this.web3.utils.fromWei(balance, 'ether');
      const formatted = parseFloat(ether).toFixed(decimals);
      return `${formatted} ETH`;
    } catch (error) {
      console.error('Error formatting balance:', error);
      return '0.0000 ETH';
    }
  }

  /**
   * Disconnect wallet (for supported providers)
   * Note: Not all wallets support programmatic disconnection
   */
  async disconnect(): Promise<void> {
    if (!window.ethereum) {
      throw new Error('Web3 provider not available');
    }

    try {
      // Different wallets have different methods for disconnection
      const provider = window.ethereum as any;
      
      if (typeof provider.disconnect === 'function') {
        await provider.disconnect();
      } else if (typeof provider.close === 'function') {
        await provider.close();
      }
      
      // Clear the accounts array regardless of whether disconnect succeeded
      this.accounts = [];
      
      // Notify listeners
      this.accountsChangedListeners.forEach(listener => listener([]));
      
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      throw error;
    }
  }

  /**
   * Clear all caches
   */
  clearCaches(): void {
    this.cachedNetworkId = null;
    this.cachedGasPrice = null;
    this.balanceCache = {};
  }
}

// Export singleton instance
export const web3Service = new Web3Service();