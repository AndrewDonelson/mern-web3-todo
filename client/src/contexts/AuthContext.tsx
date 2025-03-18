// file: client/src/contexts/AuthContext.tsx
// description: Authentication context with improved error handling
// module: Client
// License: MIT
// Author: Andrew Donelson
// Copyright 2025 Andrew Donelson

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  authService, 
  AuthUser
} from '@/services/auth.service';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (walletAddress: string) => Promise<void>;
  register: (username: string, walletAddress: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<AuthUser>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

// Define a type for the Ethereum provider with the events we need
interface EthereumProvider {
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  isMetaMask?: boolean;
  isCoinbaseWallet?: boolean;
  on: (event: string, callback: (...args: any[]) => void) => void;
  removeListener: (event: string, callback: (...args: any[]) => void) => void;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(authService.getCurrentUser());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Verify authentication on initial load
  useEffect(() => {
    const verifyAuth = async () => {
      try {
        // Check local authentication first
        if (authService.isAuthenticated()) {
          setUser(authService.getCurrentUser());
        }
        
        // Skip server verification if no backend available
        setIsLoading(false);
      } catch (error) {
        console.error('Auth verification error:', error);
        setIsLoading(false);
      }
    };

    verifyAuth();
  }, []);

  // Listen for wallet account changes
  useEffect(() => {
    const handleAccountsChanged = async (accounts: string[]) => {
      // If logged in and wallet disconnected or changed, log out
      if (user && (!accounts.length || accounts[0].toLowerCase() !== user.walletAddress.toLowerCase())) {
        await logout();
        toast({
          title: "Wallet changed",
          description: "You've been logged out because your wallet changed.",
          variant: "destructive",
        });
      }
    };

    // Set up ethereum event listeners
    if (window.ethereum) {
      // Use type assertion to help TypeScript understand the structure
      const provider = window.ethereum as EthereumProvider;
      provider.on('accountsChanged', handleAccountsChanged);
    }

    // Cleanup
    return () => {
      if (window.ethereum) {
        // Use type assertion to help TypeScript understand the structure
        const provider = window.ethereum as EthereumProvider;
        provider.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, [user]);

  /**
   * Generate and sign a message for authentication
   * @param walletAddress Wallet address to authenticate
   * @returns Signed message details
   */
  const getSignedMessage = async (walletAddress: string): Promise<{ message: string; signature: string }> => {
    try {
      // For development without a backend, use a mock nonce
      const nonce = Math.floor(Math.random() * 1000000).toString();
      
      // Create message to sign
      const message = `Web3 Todo Authentication\nWallet: ${walletAddress}\nNonce: ${nonce}`;
      
      // Request signature from wallet
      if (!window.ethereum) {
        throw new Error('Ethereum provider not available');
      }
      
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, walletAddress],
      });
      
      return { message, signature: signature as string };
    } catch (error: any) {
      console.error('Error signing message:', error);
      
      // Create a more user-friendly error message
      if (error.code === 4001) {
        throw new Error('You declined to sign the authentication message');
      }
      
      throw new Error('Failed to sign authentication message: ' + (error.message || 'Unknown error'));
    }
  };

  /**
   * Login with connected wallet
   * @param walletAddress Wallet address to login with
   */
  const login = async (walletAddress: string): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Get signature
      const { message, signature } = await getSignedMessage(walletAddress);
      
      // For development without a backend
      // Create a temporary user object
      const tempUser: AuthUser = {
        id: 'local-' + Date.now(),
        username: 'User-' + walletAddress.substring(0, 6),
        walletAddress: walletAddress,
        isAdmin: false,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };
      
      // Save user locally
      localStorage.setItem('web3_todo_user', JSON.stringify(tempUser));
      localStorage.setItem('web3_todo_auth_token', 'local-dev-token');
      
      // Update state
      setUser(tempUser);
      
      toast({
        title: "Login successful",
        description: "Welcome back!",
        variant: "success",
      });
      
      // Navigate to dashboard
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: "Login failed",
        description: error.message || "Could not login with your wallet",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Register a new user
   * @param username Username for the new user
   * @param walletAddress Wallet address to register
   */
  const register = async (username: string, walletAddress: string): Promise<void> => {
    try {
      setIsLoading(true);
      
      // For development without a backend
      // Create a temporary user object
      const tempUser: AuthUser = {
        id: 'local-' + Date.now(),
        username: username,
        walletAddress: walletAddress,
        isAdmin: false,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };
      
      // Save user locally
      localStorage.setItem('web3_todo_user', JSON.stringify(tempUser));
      localStorage.setItem('web3_todo_auth_token', 'local-dev-token');
      
      // Update state
      setUser(tempUser);
      
      toast({
        title: "Registration successful",
        description: "Your account has been created successfully!",
        variant: "success",
      });
      
      // Navigate to dashboard
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        title: "Registration failed",
        description: error.message || "Could not register your account",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Logout the current user
   */
  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Clear local storage
      localStorage.removeItem('web3_todo_user');
      localStorage.removeItem('web3_todo_auth_token');
      
      // Update state
      setUser(null);
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
      
      // Navigate to home
      navigate('/');
    } catch (error: any) {
      console.error('Logout error:', error);
      toast({
        title: "Logout issue",
        description: error.message || "There was an issue logging out",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Update user profile
   * @param data Updated profile data
   */
  const updateProfile = async (data: Partial<AuthUser>): Promise<void> => {
    try {
      setIsLoading(true);
      
      // For development without a backend
      if (user) {
        const updatedUser = { ...user, ...data };
        
        // Save updated user locally
        localStorage.setItem('web3_todo_user', JSON.stringify(updatedUser));
        
        // Update state
        setUser(updatedUser);
        
        toast({
          title: "Profile updated",
          description: "Your profile has been updated successfully",
          variant: "success",
        });
      }
    } catch (error: any) {
      console.error('Profile update error:', error);
      toast({
        title: "Update failed",
        description: error.message || "Could not update your profile",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: user?.isAdmin || false,
    login,
    register,
    logout,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};