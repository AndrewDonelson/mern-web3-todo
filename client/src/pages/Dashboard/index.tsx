// file: client/src/pages/Dashboard/index.tsx
// description: Main dashboard page displaying user tasks and statistics
// module: Client
// License: MIT
// Author: Andrew Donelson
// Copyright 2025 Andrew Donelson

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  CheckCircle2,
  Clock,
  ListTodo,
  Plus,
  Settings,
  Users,
  Activity
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { DashboardLayout } from '@/components/Dashboard/DashboardLayout';
import { StatCard } from '@/components/Dashboard/StatCard';
import { RecentTasksList } from '@/components/Dashboard/RecentTasksList';
import { CreateTaskDialog } from '@/components/Dashboard/CreateTaskDialog';
import { useAuth } from '@/contexts/AuthContext';
import { web3Service } from '@/services/web3.service';
import { accountService } from '@/services/account.service';
import { Skeleton } from '@/components/ui/skeleton';

// Types for stats
interface TaskStats {
  total: number;
  completed: number;
  inProgress: number;
  collaborators: number;
}

const Dashboard: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [networkName, setNetworkName] = useState<string>('');
  const [contractAddress, setContractAddress] = useState<string>('');
  const [walletBalance, setWalletBalance] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [taskStats, setTaskStats] = useState<TaskStats>({
    total: 0,
    completed: 0,
    inProgress: 0,
    collaborators: 0
  });

  // Use this flag to prevent data refetching once loaded
  const [dataInitialized, setDataInitialized] = useState(false);

  // Format contract address - memoized to prevent recalculation
  const formatContractAddress = useCallback((address: string) => {
    if (!address) return 'Not configured';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  }, []);

  // Memoize the contract address to prevent re-renders
  const formattedContractAddress = useMemo(() => {
    return formatContractAddress(contractAddress);
  }, [contractAddress, formatContractAddress]);

  // Memoize the task stat cards to prevent re-renders
  const statCards = useMemo(() => [
    {
      title: 'Total Tasks',
      value: taskStats.total,
      icon: ListTodo,
      trend: '',
      trendDirection: 'neutral' as const
    },
    {
      title: 'Completed',
      value: taskStats.completed,
      icon: CheckCircle2,
      trend: '',
      trendDirection: 'neutral' as const
    },
    {
      title: 'In Progress',
      value: taskStats.inProgress,
      icon: Clock,
      trend: '',
      trendDirection: 'neutral' as const
    },
    {
      title: 'Collaborators',
      value: taskStats.collaborators,
      icon: Users,
      trend: '',
      trendDirection: 'neutral' as const
    },
  ], [taskStats]);

  // Handle wallet account changes once (not on every render)
  const handleAccountsChanged = useCallback((accounts: string[]) => {
    if (accounts.length > 0) {
      setWalletAddress(accounts[0]);
      // Refresh balance for new account (but not too frequently)
      web3Service.getBalance(accounts[0])
        .then(balance => setWalletBalance(web3Service.formatBalance(balance)))
        .catch(error => console.error('Error updating balance:', error));
    } else {
      setWalletAddress('');
      setWalletBalance('');
    }
  }, []);

  // Initialize dashboard data once
  const initDashboard = useCallback(async () => {
    // Skip initialization if already done
    if (dataInitialized) return;

    setIsLoading(true);
    try {
      // Set contract address from env first to avoid a flicker
      const contractAddress = process.env.REACT_APP_VERIFICATION_CONTRACT_ADDRESS || '';
      setContractAddress(contractAddress);

      // Use user from auth context if available
      if (user && user.walletAddress) {
        setWalletAddress(user.walletAddress);
      }

      // Connect wallet if needed and not already connected
      if (!web3Service.isConnected() && !user?.walletAddress) {
        try {
          const accounts = await web3Service.connect();
          if (accounts.length > 0) {
            setWalletAddress(accounts[0]);

            // Sync account with backend if needed
            try {
              await accountService.syncWalletToAccount(accounts[0]);
            } catch (error) {
              console.error('Error syncing account:', error);
            }
          }
        } catch (error: any) {
          console.error('Error connecting wallet:', error);
          // Only show error toast if this was an actual connection error, not user rejection
          if (error.code !== 4001) {
            toast({
              title: "Connection failed",
              description: error.message || "Could not connect to your wallet.",
              variant: "destructive",
            });
          }
        }
      } else if (web3Service.isConnected()) {
        // Wallet already connected, use current account
        const accounts = web3Service.getAccounts();
        if (accounts.length > 0 && !walletAddress) {
          setWalletAddress(accounts[0]);
        }
      }

      // Get network name - only once during initialization
      try {
        const networkId = await web3Service.getNetworkId();
        const network = await web3Service.getNetworkName(networkId);
        setNetworkName(network);
      } catch (error) {
        console.error('Error getting network:', error);
        setNetworkName('Unknown Network');
      }

      // Get wallet balance if we have an address - only once during initialization
      if (walletAddress) {
        try {
          const balance = await web3Service.getBalance(walletAddress);
          const formattedBalance = web3Service.formatBalance(balance);
          setWalletBalance(formattedBalance);
        } catch (error) {
          console.error('Error fetching balance:', error);
          setWalletBalance('Error loading balance');
        }
      }

      // Fetch task statistics - in a real app, you would call your API
      // For now, we'll use simulated data
      try {
        // Simulated API call
        // const stats = await todoService.getStats();

        // Simulated data
        const stats = {
          total: 12,
          completed: 8,
          inProgress: 4,
          collaborators: 2
        };

        setTaskStats(stats);
      } catch (error) {
        console.error('Error fetching task stats:', error);
        // Keep default zeros in case of error
      }

      // Mark initialization as complete
      setDataInitialized(true);
    } catch (error) {
      console.error('Dashboard initialization error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [dataInitialized, toast, user, walletAddress]);

  // Run initialization only once
  useEffect(() => {
    initDashboard();
  }, [initDashboard]);

  // Set up wallet account change listener just once
  useEffect(() => {
    web3Service.addAccountsChangedListener(handleAccountsChanged);

    // Cleanup listener on unmount
    return () => {
      web3Service.removeAccountsChangedListener(handleAccountsChanged);
    };
  }, [handleAccountsChanged]);

  const handleCreateTask = useCallback(() => {
    if (!web3Service.isConnected()) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to create tasks.",
        variant: "destructive",
      });
      return;
    }

    setIsCreateTaskOpen(true);
  }, [toast]);

  const handleManageSettings = useCallback(() => {
    // Navigate to settings page
    window.location.href = '/settings';
  }, []);

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between py-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back{user?.username ? `, ${user.username}` : ''}! Here's an overview of your tasks.
          </p>
        </div>
        <Button onClick={handleCreateTask} className="gap-1">
          <Plus className="h-4 w-4" />
          <span>New Task</span>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          // Skeleton loaders for stats while loading
          Array(4).fill(0).map((_, index) => (
            <Card key={index} className="overflow-hidden">
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-4 w-20" />
              </CardContent>
            </Card>
          ))
        ) : (
          statCards.map((stat, index) => (
            <StatCard
              key={index}
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              trend={stat.trend}
              trendDirection={stat.trendDirection}
            />
          ))
        )}
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Recent Tasks */}
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Tasks</CardTitle>
              <CardDescription>Your most recent created and updated tasks</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => window.location.href = '/todos'}>
              View All
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              // Skeleton loaders for tasks
              <div className="space-y-4">
                {Array(3).fill(0).map((_, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[250px]" />
                      <Skeleton className="h-4 w-[200px]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <RecentTasksList />
            )}
          </CardContent>
        </Card>

        {/* Account Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Account Overview</CardTitle>
            <CardDescription>Your wallet and contract information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Wallet Address</div>
              {isLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <div className="rounded-md bg-muted p-2 text-xs font-mono break-all">
                  {walletAddress || 'Not connected'}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Wallet Balance</div>
              {isLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <div className="rounded-md bg-muted p-2 text-xs flex items-center">
                  <Activity className="h-4 w-4 mr-2 text-green-500" />
                  {walletBalance || 'Unknown'}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Contract Address</div>
              {isLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <div className="rounded-md bg-muted p-2 text-xs font-mono">
                  {formattedContractAddress}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Network</div>
              {isLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <div className="rounded-md bg-muted p-2 text-xs">
                  {networkName || 'Unknown Network'}
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleManageSettings}
            >
              <Settings className="h-4 w-4 mr-2" />
              Manage Settings
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Create Task Dialog */}
      <CreateTaskDialog
        open={isCreateTaskOpen}
        onOpenChange={setIsCreateTaskOpen}
      />
    </DashboardLayout>
  );
};

export default Dashboard;