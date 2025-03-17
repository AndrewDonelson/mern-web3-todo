// file: client/src/pages/Profile/index.tsx
// description: User profile page for viewing and updating user account details
// module: Client
// License: MIT
// Author: Andrew Donelson
// Copyright 2025 Andrew Donelson

import React, { useState, useEffect } from 'react';
import { User, Shield, History, Wallet, Copy, CheckCircle2, EditIcon } from 'lucide-react';

import { DashboardLayout } from '@/components/Dashboard/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { formatWalletAddress, copyToClipboard } from '@/lib/utils';

import { ProfileForm } from '@/components/Profile/ProfileForm';
import { SecuritySettings } from '@/components/Profile/SecuritySettings';
import { ActivityHistory } from '@/components/Profile/ActivityHistory';
import { ConnectedWallets } from '@/components/Profile/ConnectedWallets';

const ProfilePage: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('profile');
  const [isAddressCopied, setIsAddressCopied] = useState(false);
  
  // Mock user data - in a real app, this would come from a user context or API call
  const user = {
    name: 'Andrew Donelson',
    email: 'andrew@example.com',
    walletAddress: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
    avatarUrl: '',
    joinedDate: 'March 2025',
    tasksCompleted: 48,
    tasksInProgress: 12,
    role: 'Developer',
  };

  useEffect(() => {
    if (isAddressCopied) {
      const timer = setTimeout(() => {
        setIsAddressCopied(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isAddressCopied]);

  const handleCopyAddress = async () => {
    const success = await copyToClipboard(user.walletAddress);
    if (success) {
      setIsAddressCopied(true);
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

  return (
    <DashboardLayout>
      <div className="container max-w-6xl p-0">
        <div className="flex flex-col space-y-6">
          {/* Profile Header */}
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
              <p className="text-muted-foreground">
                Manage your account settings and preferences
              </p>
            </div>
            <Button variant="outline" className="gap-2 md:self-end">
              <EditIcon className="h-4 w-4" />
              <span>Edit Profile</span>
            </Button>
          </div>
          
          {/* User info card */}
          <Card className="overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-primary/20 to-primary/10"></div>
            <CardContent className="-mt-16 grid gap-6 p-6 md:grid-cols-[1fr_2fr]">
              <div className="flex flex-col items-center space-y-3">
                <Avatar className="h-24 w-24 border-4 border-background">
                  <AvatarImage src={user.avatarUrl} alt={user.name} />
                  <AvatarFallback className="text-2xl">
                    {user.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="text-center">
                  <h2 className="text-xl font-bold">{user.name}</h2>
                  <p className="text-sm text-muted-foreground">{user.role}</p>
                </div>
                <div className="flex w-full flex-col space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Wallet</span>
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-xs">{formatWalletAddress(user.walletAddress)}</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6" 
                        onClick={handleCopyAddress}
                      >
                        {isAddressCopied ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Member since</span>
                    <span>{user.joinedDate}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="grid gap-3 md:grid-cols-3">
                  <Card>
                    <CardHeader className="p-3">
                      <CardTitle className="text-base">Tasks Completed</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <div className="text-2xl font-bold">{user.tasksCompleted}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="p-3">
                      <CardTitle className="text-base">In Progress</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <div className="text-2xl font-bold">{user.tasksInProgress}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="p-3">
                      <CardTitle className="text-base">Completion Rate</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <div className="text-2xl font-bold">
                        {Math.round((user.tasksCompleted / (user.tasksCompleted + user.tasksInProgress)) * 100)}%
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <div className="rounded-lg bg-muted p-4">
                  <div className="flex items-start space-x-4">
                    <div className="rounded-full bg-background p-2">
                      <Wallet className="h-5 w-5 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Connect your wallet for decentralized storage</p>
                      <p className="text-xs text-muted-foreground">
                        Your task data is securely stored on the blockchain, ensuring it's always available and under your control.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Tabs for different profile sections */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full justify-start gap-4">
              <TabsTrigger value="profile" className="gap-2">
                <User className="h-4 w-4" />
                <span>Profile</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="gap-2">
                <Shield className="h-4 w-4" />
                <span>Security</span>
              </TabsTrigger>
              <TabsTrigger value="activity" className="gap-2">
                <History className="h-4 w-4" />
                <span>Activity</span>
              </TabsTrigger>
              <TabsTrigger value="wallets" className="gap-2">
                <Wallet className="h-4 w-4" />
                <span>Wallets</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="profile" className="mt-6">
              <ProfileForm user={user} />
            </TabsContent>
            
            <TabsContent value="security" className="mt-6">
              <SecuritySettings />
            </TabsContent>
            
            <TabsContent value="activity" className="mt-6">
              <ActivityHistory />
            </TabsContent>
            
            <TabsContent value="wallets" className="mt-6">
              <ConnectedWallets />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;