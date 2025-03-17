// file: client/src/components/Profile/ConnectedWallets.tsx
// description: Connected wallets management component
// module: Client
// License: MIT
// Author: Andrew Donelson
// Copyright 2025 Andrew Donelson

import React, { useState } from 'react';
import { Wallet, Plus, X, Copy, CheckCircle2, RefreshCw, Shield, ExternalLink } from 'lucide-react';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { formatWalletAddress, copyToClipboard } from '@/lib/utils';

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

// Type for wallet data
interface WalletData {
  id: string;
  name: string;
  address: string;
  type: string;
  isPrimary: boolean;
  lastUsed: string;
  connectedSince: string;
}

// Mock connected wallets data
const mockWallets: WalletData[] = [
  {
    id: 'wallet1',
    name: 'MetaMask Primary',
    address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
    type: 'MetaMask',
    isPrimary: true,
    lastUsed: 'Today',
    connectedSince: 'March 10, 2025',
  },
  {
    id: 'wallet2',
    name: 'Coinbase Wallet',
    address: '0x8932Bb44A2c3c4CAb857318e0d987B3117e8B5Af',
    type: 'Coinbase',
    isPrimary: false,
    lastUsed: '3 days ago',
    connectedSince: 'March 14, 2025',
  }
];

export const ConnectedWallets: React.FC = () => {
  const { toast } = useToast();
  const [wallets, setWallets] = useState<WalletData[]>(mockWallets);
  const [isAddWalletOpen, setIsAddWalletOpen] = useState(false);
  const [isConfirmRemoveOpen, setIsConfirmRemoveOpen] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [editingWallet, setEditingWallet] = useState<string | null>(null);
  const [editedName, setEditedName] = useState('');
  const [isAddressCopied, setIsAddressCopied] = useState<Record<string, boolean>>({});
  const [newWalletType, setNewWalletType] = useState('MetaMask');

  const handleCopyAddress = async (address: string, walletId: string) => {
    const success = await copyToClipboard(address);
    
    if (success) {
      setIsAddressCopied(prev => ({ ...prev, [walletId]: true }));
      
      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setIsAddressCopied(prev => ({ ...prev, [walletId]: false }));
      }, 2000);
      
      toast({
        title: "Address copied",
        description: "Wallet address copied to clipboard",
        variant: "success",
      });
    } else {
      toast({
        title: "Failed to copy",
        description: "Could not copy wallet address to clipboard",
        variant: "destructive",
      });
    }
  };

  const startEditingName = (walletId: string, currentName: string) => {
    setEditingWallet(walletId);
    setEditedName(currentName);
  };

  const saveWalletName = (walletId: string) => {
    if (!editedName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a wallet name",
        variant: "destructive",
      });
      return;
    }

    setWallets(currentWallets => 
      currentWallets.map(wallet => 
        wallet.id === walletId ? { ...wallet, name: editedName } : wallet
      )
    );
    
    setEditingWallet(null);
    
    toast({
      title: "Wallet updated",
      description: "Wallet name has been updated",
      variant: "success",
    });
  };

  const confirmRemoveWallet = (walletId: string) => {
    setSelectedWallet(walletId);
    setIsConfirmRemoveOpen(true);
  };

  const removeWallet = () => {
    if (!selectedWallet) return;
    
    // Filter out the selected wallet
    setWallets(currentWallets => 
      currentWallets.filter(wallet => wallet.id !== selectedWallet)
    );
    
    setIsConfirmRemoveOpen(false);
    setSelectedWallet(null);
    
    toast({
      title: "Wallet removed",
      description: "The wallet has been disconnected from your account",
      variant: "success",
    });
  };

  const setPrimaryWallet = (walletId: string) => {
    setWallets(currentWallets => 
      currentWallets.map(wallet => ({
        ...wallet,
        isPrimary: wallet.id === walletId
      }))
    );
    
    toast({
      title: "Primary wallet updated",
      description: "Your primary wallet has been updated",
      variant: "success",
    });
  };

  const connectNewWallet = async () => {
    try {
      // This would connect to the actual wallet in a real app
      // For now, we'll simulate the connection
      
      // Check if MetaMask or Coinbase is available
      if (!window.ethereum) {
        toast({
          title: "Wallet not detected",
          description: `Please install ${newWalletType} extension to connect`,
          variant: "destructive",
        });
        return;
      }
      
      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      // Check if accounts array exists and has at least one account
      if (!accounts || !Array.isArray(accounts) || accounts.length === 0) {
        toast({
          title: "No accounts found",
          description: "Please unlock your wallet and try again",
          variant: "destructive",
        });
        return;
      }
      
      const newAddress = accounts[0] as string;
      
      // Check if wallet is already connected
      if (wallets.some(wallet => wallet.address.toLowerCase() === newAddress.toLowerCase())) {
        toast({
          title: "Wallet already connected",
          description: "This wallet is already connected to your account",
          variant: "destructive",
        });
        return;
      }
      
      // Add the new wallet
      const newWallet: WalletData = {
        id: `wallet${Date.now()}`,
        name: `${newWalletType} Wallet`,
        address: newAddress,
        type: newWalletType,
        isPrimary: wallets.length === 0, // Make primary if it's the first wallet
        lastUsed: 'Just now',
        connectedSince: new Date().toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        }),
      };
      
      setWallets(current => [...current, newWallet]);
      setIsAddWalletOpen(false);
      
      toast({
        title: "Wallet connected",
        description: "New wallet has been connected to your account",
        variant: "success",
      });
      
    } catch (error: any) {
      console.error("Failed to connect wallet:", error);
      toast({
        title: "Connection failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Connected Wallets</CardTitle>
              <CardDescription>
                Manage the wallets connected to your account
              </CardDescription>
            </div>
            <Button
              onClick={() => setIsAddWalletOpen(true)}
              className="gap-1"
            >
              <Plus className="h-4 w-4" />
              <span>Add Wallet</span>
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {wallets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="rounded-full bg-muted p-3">
                <Wallet className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-medium">No wallets connected</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Connect a wallet to manage your tasks on the blockchain
              </p>
              <Button 
                className="mt-4 gap-1"
                onClick={() => setIsAddWalletOpen(true)}
              >
                <Plus className="h-4 w-4" />
                <span>Connect Wallet</span>
              </Button>
            </div>
          ) : (
            wallets.map((wallet, index) => (
              <div key={wallet.id} className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {editingWallet === wallet.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={editedName}
                            onChange={(e) => setEditedName(e.target.value)}
                            className="h-8 w-48"
                            autoFocus
                          />
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 px-2"
                            onClick={() => saveWalletName(wallet.id)}
                          >
                            Save
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 px-2"
                            onClick={() => setEditingWallet(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <>
                          <h3 className="text-base font-medium">{wallet.name}</h3>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={() => startEditingName(wallet.id, wallet.name)}
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                            <span className="sr-only">Edit name</span>
                          </Button>
                        </>
                      )}
                      {wallet.isPrimary && (
                        <Badge variant="secondary" className="ml-1 text-xs">
                          Primary
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{wallet.type}</span>
                      <span className="text-xs">•</span>
                      <span>Last used: {wallet.lastUsed}</span>
                    </div>
                    
                    <div className="mt-1 flex items-center gap-1 font-mono text-xs text-muted-foreground">
                      {formatWalletAddress(wallet.address, 8, 6)}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6" 
                        onClick={() => handleCopyAddress(wallet.address, wallet.id)}
                      >
                        {isAddressCopied[wallet.id] ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => window.open(`https://etherscan.io/address/${wallet.address}`, '_blank')}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    {!wallet.isPrimary && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setPrimaryWallet(wallet.id)}
                      >
                        Set as Primary
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => confirmRemoveWallet(wallet.id)}
                    >
                      <X className="mr-1 h-4 w-4" />
                      Disconnect
                    </Button>
                  </div>
                </div>
                
                {index < wallets.length - 1 && <Separator />}
              </div>
            ))
          )}
        </CardContent>
        
        <CardFooter className="flex flex-col items-stretch">
          <Alert className="border-primary/50 bg-primary/10">
            <Shield className="h-4 w-4 text-primary" />
            <AlertDescription>
              Connecting multiple wallets provides backup options if one becomes unavailable or compromised.
            </AlertDescription>
          </Alert>
        </CardFooter>
      </Card>

      {/* Add Wallet Dialog */}
      <Dialog open={isAddWalletOpen} onOpenChange={setIsAddWalletOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect a Wallet</DialogTitle>
            <DialogDescription>
              Connect an Ethereum wallet to interact with the blockchain.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Wallet Provider</Label>
              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  variant={newWalletType === 'MetaMask' ? 'default' : 'outline'}
                  className="justify-start gap-2"
                  onClick={() => setNewWalletType('MetaMask')}
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-100">
                    <span className="text-orange-600">M</span>
                  </div>
                  <span>MetaMask</span>
                </Button>
                
                <Button
                  type="button"
                  variant={newWalletType === 'Coinbase' ? 'default' : 'outline'}
                  className="justify-start gap-2"
                  onClick={() => setNewWalletType('Coinbase')}
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100">
                    <span className="text-blue-600">C</span>
                  </div>
                  <span>Coinbase Wallet</span>
                </Button>
              </div>
            </div>
            
            <div className="rounded-md bg-muted p-3 text-sm">
              <p className="text-muted-foreground">
                You'll be asked to approve this connection from your wallet.
                Make sure you're on <strong>mern-web3-todo.com</strong> before approving.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddWalletOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={connectNewWallet}
              className="gap-1"
            >
              <Wallet className="h-4 w-4" />
              <span>Connect {newWalletType}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Remove Wallet Dialog */}
      <Dialog open={isConfirmRemoveOpen} onOpenChange={setIsConfirmRemoveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disconnect Wallet</DialogTitle>
            <DialogDescription>
              Are you sure you want to disconnect this wallet? You'll need to reconnect it to use it again.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {selectedWallet && (
              <div className="rounded-md bg-muted p-3">
                <p className="text-sm font-medium">
                  {wallets.find(w => w.id === selectedWallet)?.name}
                </p>
                <p className="mt-1 font-mono text-xs text-muted-foreground">
                  {formatWalletAddress(
                    wallets.find(w => w.id === selectedWallet)?.address || '',
                    10,
                    8
                  )}
                </p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsConfirmRemoveOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={removeWallet}
            >
              Disconnect Wallet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};