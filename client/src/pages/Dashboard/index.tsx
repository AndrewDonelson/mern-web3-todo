// file: client/src/pages/Dashboard/index.tsx
// description: Main dashboard page displaying user tasks and statistics
// module: Client
// License: MIT
// Author: Andrew Donelson
// Copyright 2025 Andrew Donelson

import React, { useEffect, useState } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  LayoutDashboard, 
  ListTodo, 
  Plus, 
  Settings, 
  Users
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { DashboardLayout } from '@/components/Dashboard/DashboardLayout';
import { StatCard } from '@/components/Dashboard/StatCard';
import { RecentTasksList } from '@/components/Dashboard/RecentTasksList';
import { CreateTaskDialog } from '@/components/Dashboard/CreateTaskDialog';

// Mock data for statistics
const mockStats = [
  { title: 'Total Tasks', value: 24, icon: ListTodo, trend: '+5', trendDirection: 'up' },
  { title: 'Completed', value: 18, icon: CheckCircle2, trend: '+3', trendDirection: 'up' },
  { title: 'In Progress', value: 6, icon: Clock, trend: '+2', trendDirection: 'up' },
  { title: 'Collaborators', value: 3, icon: Users, trend: '0', trendDirection: 'neutral' },
];

const Dashboard: React.FC = () => {
  const { toast } = useToast();
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>('');

  useEffect(() => {
    // Check if user wallet is connected (simplified for now)
    const checkConnection = async () => {
      try {
        if (window.ethereum) {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setIsWalletConnected(true);
            setWalletAddress(accounts[0]);
          } else {
            // Prompt user to connect their wallet
            const requestedAccounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            if (requestedAccounts.length > 0) {
              setIsWalletConnected(true);
              setWalletAddress(requestedAccounts[0]);
              toast({
                title: "Wallet connected",
                description: "Your wallet has been connected successfully.",
                variant: "success",
              });
            }
          }
        } else {
          toast({
            title: "Wallet not detected",
            description: "Please install MetaMask to use this application.",
            variant: "destructive",
          });
        }
      } catch (error: any) {
        console.error('Error connecting wallet:', error);
        toast({
          title: "Connection failed",
          description: error.message || "Could not connect to your wallet.",
          variant: "destructive",
        });
      }
    };

    checkConnection();
  }, [toast]);

  const handleCreateTask = () => {
    setIsCreateTaskOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between py-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's an overview of your tasks.
          </p>
        </div>
        <Button onClick={handleCreateTask} className="gap-1">
          <Plus className="h-4 w-4" />
          <span>New Task</span>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {mockStats.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            trend={stat.trend}
            trendDirection={stat.trendDirection as 'up' | 'down' | 'neutral'}
          />
        ))}
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Recent Tasks */}
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Tasks</CardTitle>
              <CardDescription>Your most recent created and updated tasks</CardDescription>
            </div>
            <Button variant="outline" size="sm">
              View All
            </Button>
          </CardHeader>
          <CardContent>
            <RecentTasksList />
          </CardContent>
        </Card>

        {/* Activity Feed */}
        <Card>
          <CardHeader>
            <CardTitle>Account Overview</CardTitle>
            <CardDescription>Your wallet and contract information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Wallet Address</div>
              <div className="rounded-md bg-muted p-2 text-xs font-mono break-all">
                {walletAddress || 'Not connected'}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Contract Address</div>
              <div className="rounded-md bg-muted p-2 text-xs font-mono">
                0x1234...abcd
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Network</div>
              <div className="rounded-md bg-muted p-2 text-xs">
                Ethereum Mainnet
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" size="sm" className="w-full">
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