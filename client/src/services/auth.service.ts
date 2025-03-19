// file: client/src/services/auth.service.ts
// description: Service for handling authentication with Web3 wallets and backend
// module: Client
// License: MIT
// Author: Andrew Donelson
// Copyright 2025 Andrew Donelson

import axios from 'axios';
import { apiClient } from './api';
import { localStorageService } from './localstorage.service';

export interface AuthUser {
  id: string;
  username: string;
  walletAddress: string;
  isAdmin: boolean;
  createdAt: string;
  lastLogin: string;
  profileImageUrl?: string;
}

export interface LoginResponse {
  user: AuthUser;
  token: string;
  expiresAt: number;
}

export interface RegistrationData {
  username: string;
  walletAddress: string;
  signature: string;
  message: string;
}

export interface LoginData {
  walletAddress: string;
  signature: string;
  message: string;
}

export interface ProfileResponse {
  user: AuthUser;
}

export interface VerifyResponse {
  user: AuthUser;
}

/**
 * Service for handling authentication with Web3 wallets and backend
 */
class AuthService {
  private readonly TOKEN_KEY = 'web3_todo_auth_token';
  private readonly USER_KEY = 'web3_todo_user';
  private currentUser: AuthUser | null = null;

  constructor() {
    // Initialize user from localStorage if available
    this.loadUserFromStorage();
  }

  /**
   * Load user data from local storage
   */
  private loadUserFromStorage(): void {
    const user = localStorageService.getItem<AuthUser>(this.USER_KEY);
    if (user) {
      this.currentUser = user;
    }
  }

  /**
   * Save authentication data to storage
   * @param data Login response data
   */
  private saveAuthData(data: LoginResponse): void {
    localStorageService.setRawItem(this.TOKEN_KEY, data.token);
    localStorageService.setItem<AuthUser>(this.USER_KEY, data.user);
    this.currentUser = data.user;
    
    // Set the token in the API client for future requests
    apiClient.setAuthToken(data.token);
  }

  /**
   * Clear authentication data
   */
  public clearAuth(): void {
    localStorageService.removeItem(this.TOKEN_KEY);
    localStorageService.removeItem(this.USER_KEY);
    this.currentUser = null;
    
    // Clear token from API client
    apiClient.clearAuthToken();
  }

  /**
   * Get the current authentication token
   * @returns Auth token or null if not authenticated
   */
  public getToken(): string | null {
    return localStorageService.getRawItem(this.TOKEN_KEY);
  }

  /**
   * Check if the user is authenticated
   * @returns True if authenticated
   */
  public isAuthenticated(): boolean {
    return !!this.getToken();
  }

  /**
   * Get the current authenticated user
   * @returns User data or null if not authenticated
   */
  public getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  /**
   * Check if the current user is an admin
   * @returns True if the user is an admin
   */
  public isAdmin(): boolean {
    return this.currentUser?.isAdmin || false;
  }

  /**
   * Get a nonce for the provided wallet address
   * @param walletAddress Ethereum wallet address
   * @returns Nonce string to sign
   */
  public async getNonce(walletAddress: string): Promise<string> {
    try {
      const response = await axios.get<{ nonce: string }>(`/api/auth/nonce?walletAddress=${walletAddress}`);
      return response.data.nonce;
    } catch (error: any) {
      console.error('Error getting nonce:', error);
      throw new Error(error.response?.data?.message || 'Failed to get nonce');
    }
  }

  /**
   * Register a new user
   * @param data Registration data
   * @returns Login response with user data and token
   */
  public async register(data: RegistrationData): Promise<LoginResponse> {
    try {
      const response = await axios.post<LoginResponse>('/api/auth/register', data);
      this.saveAuthData(response.data);
      return response.data;
    } catch (error: any) {
      console.error('Registration error:', error);
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  }

  /**
   * Login with wallet
   * @param data Login data including signature
   * @returns Login response with user data and token
   */
  public async login(data: LoginData): Promise<LoginResponse> {
    try {
      const response = await axios.post<LoginResponse>('/api/auth/login', data);
      this.saveAuthData(response.data);
      return response.data;
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  }

  /**
   * Logout the current user
   */
  public async logout(): Promise<void> {
    try {
      if (this.isAuthenticated()) {
        // Optionally notify the backend about logout
        await axios.post('/api/auth/logout');
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearAuth();
    }
  }

  /**
   * Update the user's profile
   * @param profileData Updated profile data
   * @returns Updated user data
   */
  public async updateProfile(profileData: Partial<AuthUser>): Promise<AuthUser> {
    try {      
      const response = await apiClient.put<ProfileResponse>('/api/users/profile', profileData);
      
      // Update local storage with new user data
      const updatedUser = { ...this.currentUser, ...response.user };
      localStorageService.setItem<AuthUser>(this.USER_KEY, updatedUser);
      this.currentUser = updatedUser;
      
      return updatedUser;
    } catch (error: any) {
      console.error('Profile update error:', error);
      throw new Error(error.response?.data?.message || 'Failed to update profile');
    }
  }

  /**
   * Verify the current authentication state
   * Ensures token is still valid and refreshes user data
   * @returns True if still authenticated
   */
  public async verifyAuth(): Promise<boolean> {
    if (!this.isAuthenticated()) {
      return false;
    }

    try {      
      const response = await apiClient.get<VerifyResponse>('/api/auth/verify');
      
      // Update user data with latest from server
      this.currentUser = response.user;
      localStorageService.setItem<AuthUser>(this.USER_KEY, response.user);
      
      return true;
    } catch (error) {
      console.error('Auth verification failed:', error);
      this.clearAuth();
      return false;
    }
  }
}

// Export singleton instance
export const authService = new AuthService();