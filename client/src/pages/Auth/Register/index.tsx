// file: client/src/pages/Auth/Register/index.tsx
// description: Registration page with Web3 wallet authentication 
// module: Client
// License: MIT
// Author: Andrew Donelson
// Copyright 2025 Andrew Donelson

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, KeyRound, Wallet } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { AuthLayout } from '@/components/Auth/AuthLayout';
import { useAuth } from '@/contexts/AuthContext';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { register } = useAuth();
  const [username, setUsername] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [step, setStep] = useState<'info' | 'wallet'>('info');

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
  };

  const handleSubmitInfo = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      toast({
        title: "Username required",
        description: "Please enter a username to continue.",
        variant: "destructive",
      });
      return;
    }
    
    // Move to wallet connection step
    setStep('wallet');
  };

  const handleConnectWallet = async () => {
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

      // Use the AuthContext's register function
      await register(username, account);

      // Redirect to dashboard after successful registration
      navigate('/dashboard');

    } catch (error: any) {
      console.error("Registration error:", error);
      toast({
        title: "Registration failed",
        description: error.message || "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleBackToInfo = () => {
    setStep('info');
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
            <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
            <CardDescription>
              {step === 'info' 
                ? "Enter your information to get started" 
                : "Connect your wallet to secure your account"}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {step === 'info' ? (
              <form onSubmit={handleSubmitInfo}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      placeholder="Enter your username"
                      value={username}
                      onChange={handleUsernameChange}
                      required
                    />
                  </div>
                  
                  <Button type="submit" className="w-full">
                    Continue
                  </Button>
                </div>
              </form>
            ) : (
              <>
                <div className="rounded-md bg-muted p-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Profile Information</p>
                      <p className="text-sm text-muted-foreground">
                        Username: {username}
                      </p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleBackToInfo}
                    >
                      Edit
                    </Button>
                  </div>
                </div>
                
                <Button 
                  variant="outline" 
                  className="w-full gap-2" 
                  onClick={handleConnectWallet}
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
              </>
            )}
            
            <div className="mt-4 text-center text-sm text-muted-foreground">
              <p>
                By creating an account, you agree to our{' '}
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
              Already have an account?{' '}
              <Link to="/login" className="text-primary underline hover:text-primary/90">
                Log in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </AuthLayout>
  );
};

export default RegisterPage;