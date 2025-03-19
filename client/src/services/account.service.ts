// file: client/src/services/account.service.ts
// description: Service for managing user account operations
// module: Client
// License: MIT
// Author: Andrew Donelson
// Copyright 2025 Andrew Donelson

import { apiClient } from './api';
import { authService, AuthUser } from './auth.service';

export interface AccountProfile {
  walletAddress: string;
  username: string;
  fullName?: string;
  bio?: string;
  avatarUrl?: string;
  coverImageUrl?: string;
  socialLinks?: {
    website?: string;
    twitter?: string;
    github?: string;
    linkedin?: string;
  };
  preferences?: {
    theme: 'light' | 'dark' | 'system';
    emailNotifications: boolean;
    displayWalletAddress: boolean;
  };
  isAdmin: boolean;
  createdAt: string;
}

export interface PreferencesResponse {
  message: string;
  preferences: {
    theme: 'light' | 'dark' | 'system';
    emailNotifications: boolean;
    displayWalletAddress: boolean;
  };
}

export interface DeactivationResponse {
  message: string;
  deactivatedAt: string;
}

/**
 * Service for managing account information and operations
 * This extends beyond basic authentication to handle profile data and preferences
 */
class AccountService {
  /**
   * Get all accounts (public profiles only)
   * @returns Array of public account profiles
   */
  public async getAllAccounts(): Promise<AccountProfile[]> {
    try {
      return await apiClient.get<AccountProfile[]>('/api/accounts');
    } catch (error: any) {
      console.error('Error fetching accounts:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch accounts');
    }
  }

  /**
   * Register a new account
   * @param walletAddress User's wallet address
   * @param username Display name for the user
   * @param fullName Optional full name
   * @returns Public profile of the new account
   */
  public async registerAccount(walletAddress: string, username: string, fullName?: string): Promise<AccountProfile> {
    try {
      const response = await apiClient.post<AccountProfile>('/api/accounts', {
        walletAddress,
        username,
        fullName
      });
      return response;
    } catch (error: any) {
      console.error('Error registering account:', error);
      throw new Error(error.response?.data?.message || 'Failed to register account');
    }
  }

  /**
   * Get an account by wallet address
   * @param walletAddress Ethereum wallet address
   * @returns Public profile information
   */
  public async getAccountByWalletAddress(walletAddress: string): Promise<AccountProfile> {
    try {
      return await apiClient.get<AccountProfile>(`/api/accounts/${walletAddress}`);
    } catch (error: any) {
      console.error('Error fetching account:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch account');
    }
  }

  /**
   * Update basic account information
   * @param walletAddress Ethereum wallet address
   * @param updateData Updated account data
   * @returns Updated public profile
   */
  public async updateAccount(
    walletAddress: string, 
    updateData: {
      username?: string;
      email?: string;
    }
  ): Promise<AccountProfile> {
    try {
      // Only send fields that are provided
      const payload: any = {};
      if (updateData.username) payload.username = updateData.username;
      if (updateData.email) payload.email = updateData.email;

      const response = await apiClient.put<AccountProfile>(`/api/accounts/${walletAddress}`, payload);
      
      // If this is the current user, update auth context too
      const currentUser = authService.getCurrentUser();
      if (currentUser && currentUser.walletAddress.toLowerCase() === walletAddress.toLowerCase()) {
        await authService.updateProfile(payload);
      }
      
      return response;
    } catch (error: any) {
      console.error('Error updating account:', error);
      throw new Error(error.response?.data?.message || 'Failed to update account');
    }
  }

  /**
   * Update an account's extended profile information
   * @param walletAddress Ethereum wallet address
   * @param profileData Updated profile information
   * @returns Updated public profile
   */
  public async updateProfile(
    walletAddress: string,
    profileData: {
      fullName?: string;
      bio?: string;
      avatarUrl?: string;
      coverImageUrl?: string;
      socialLinks?: {
        website?: string;
        twitter?: string;
        github?: string;
        linkedin?: string;
      };
    }
  ): Promise<AccountProfile> {
    try {
      const response = await apiClient.put<AccountProfile>(
        `/api/accounts/${walletAddress}/profile`,
        profileData
      );
      
      // If this is the current user, update auth context with relevant fields
      const currentUser = authService.getCurrentUser();
      if (currentUser && currentUser.walletAddress.toLowerCase() === walletAddress.toLowerCase()) {
        const profileToUpdate: Partial<AuthUser> = {};
        if (profileData.fullName) profileToUpdate.username = profileData.fullName;
        if (profileData.avatarUrl) profileToUpdate.profileImageUrl = profileData.avatarUrl;
        
        if (Object.keys(profileToUpdate).length > 0) {
          await authService.updateProfile(profileToUpdate);
        }
      }
      
      return response;
    } catch (error: any) {
      console.error('Error updating profile:', error);
      throw new Error(error.response?.data?.message || 'Failed to update profile');
    }
  }

  /**
   * Update an account's preferences
   * @param walletAddress Ethereum wallet address
   * @param preferences Updated preferences
   * @returns Preferences update response
   */
  public async updatePreferences(
    walletAddress: string,
    preferences: {
      theme?: 'light' | 'dark' | 'system';
      emailNotifications?: boolean;
      displayWalletAddress?: boolean;
    }
  ): Promise<PreferencesResponse> {
    try {
      return await apiClient.put<PreferencesResponse>(
        `/api/accounts/${walletAddress}/preferences`,
        preferences
      );
    } catch (error: any) {
      console.error('Error updating preferences:', error);
      throw new Error(error.response?.data?.message || 'Failed to update preferences');
    }
  }

  /**
   * Get a nonce for the provided wallet address
   * This is a convenience method that wraps the auth service
   * @param walletAddress Ethereum wallet address
   * @returns Nonce string to sign
   */
  public async getNonce(walletAddress: string): Promise<string> {
    return authService.getNonce(walletAddress);
  }

  /**
   * Deactivate an account (not permanent deletion)
   * @param walletAddress Ethereum wallet address to deactivate
   * @returns Deactivation response
   */
  public async deactivateAccount(walletAddress: string): Promise<DeactivationResponse> {
    try {
      const response = await apiClient.delete<DeactivationResponse>(`/api/accounts/${walletAddress}`);
      
      // If this is the current user, log them out
      const currentUser = authService.getCurrentUser();
      if (currentUser && currentUser.walletAddress.toLowerCase() === walletAddress.toLowerCase()) {
        await authService.logout();
      }
      
      return response;
    } catch (error: any) {
      console.error('Error deactivating account:', error);
      throw new Error(error.response?.data?.message || 'Failed to deactivate account');
    }
  }

  /**
   * Synchronize Web3 wallet with account
   * This ensures that the account exists for the connected wallet,
   * creating it if necessary and keeping wallet information up to date
   * @param walletAddress Ethereum wallet address
   * @param username Initial username to use if creating a new account
   * @returns Account profile
   */
  public async syncWalletToAccount(walletAddress: string, username?: string): Promise<AccountProfile> {
    try {
      // Try to find an existing account for this wallet
      try {
        return await this.getAccountByWalletAddress(walletAddress);
      } catch (error: any) {
        // If 404, create a new account
        if (error.response?.status === 404) {
          if (!username) {
            // Generate a default username from wallet address
            username = `User_${walletAddress.substring(2, 8)}`;
          }
          
          return await this.registerAccount(walletAddress, username);
        }
        
        // If other error, re-throw
        throw error;
      }
    } catch (error: any) {
      console.error('Error syncing wallet to account:', error);
      throw new Error(error.response?.data?.message || 'Failed to sync wallet with account');
    }
  }

  /**
   * Check if account exists for wallet
   * @param walletAddress Ethereum wallet address
   * @returns True if an account exists for this wallet
   */
  public async doesAccountExist(walletAddress: string): Promise<boolean> {
    try {
      await this.getAccountByWalletAddress(walletAddress);
      return true;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return false;
      }
      // Re-throw other errors
      throw error;
    }
  }
}

// Export singleton instance
export const accountService = new AccountService();