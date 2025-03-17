// file: client/src/pages/Auth/Login/index.tsx
// description: Login page with Web3 wallet authentication
// module: Client
// License: MIT
// Author: Andrew Donelson
// Copyright 2025 Andrew Donelson

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, KeyRound, Wallet } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { AuthLayout } from '@/components/Auth/AuthLayout';

// Type definition for window.ethereum
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      isMetaMask?: boolean;
      isCoinbaseWallet?: boolean;
    };
  }
}

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleLoginWithWallet = async () => {
    try {
      setIsConnecting(true);
      
      // Check if MetaMask is installed
      if (!window.ethereum) {
        toast({
          title: "MetaMask not detected",
          description: "Please install MetaMask browser extension to continue.",
          variant: "destructive",
        });
        return;
      }

      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      // Check if accounts array exists and has at least one account
      if (!accounts || !Array.isArray(accounts) || accounts.length === 0) {
        toast({
          title: "Connection failed",
          description: "Failed to connect to your wallet. Please try again.",
          variant: "destructive",
        });
        return;
      }
      
      const account = accounts[0] as string;

      // Get signature to verify ownership (simplified for now)
      const message = `Web3 Todo Login Request\nNonce: ${Date.now()}`;
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, account],
      });

      if (!signature) {
        toast({
          title: "Authentication failed",
          description: "Failed to authenticate. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // In a real app, you would send this signature to your backend for verification
      // For now, we'll just simulate a successful login
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });

      // Redirect to dashboard
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);

    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "Login failed",
        description: error.message || "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <AuthLayout>
      <div className="flex w-full flex-col items-center justify-center px-4 sm:px-6">
        <Link 
          to="/" 
          className="mb-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to home</span>
        </Link>
        
        <div className="mb-4 flex items-center gap-2">
          <CheckCircle className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">Web3 Todo</span>
        </div>
        
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold">Log in</CardTitle>
            <CardDescription>
              Connect your wallet to access your tasks
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <Button 
              variant="outline" 
              className="w-full gap-2" 
              onClick={handleLoginWithWallet}
              disabled={isConnecting}
            >
              <Wallet className="h-4 w-4" />
              {isConnecting ? "Connecting..." : "Connect with MetaMask"}
            </Button>
            
            <div className="flex items-center">
              <Separator className="flex-1" />
              <span className="mx-4 text-xs text-muted-foreground">
                or continue with
              </span>
              <Separator className="flex-1" />
            </div>
            
            <div className="grid gap-2">
              <Button 
                variant="secondary" 
                className="w-full gap-2"
                disabled={true}
              >
                <KeyRound className="h-4 w-4" />
                <span>Connect with Coinbase Wallet</span>
              </Button>
            </div>
            
            <div className="mt-4 text-center text-sm text-muted-foreground">
              <p>
                By connecting your wallet, you agree to our{' '}
                <Link to="/terms" className="underline hover:text-primary">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="underline hover:text-primary">
                  Privacy Policy
                </Link>
              </p>
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col">
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary underline hover:text-primary/90">
                Sign up
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </AuthLayout>
  );
};

export default LoginPage;