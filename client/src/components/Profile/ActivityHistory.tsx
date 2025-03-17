// file: client/src/components/Profile/ActivityHistory.tsx
// description: Activity history and logs for user account
// module: Client
// License: MIT
// Author: Andrew Donelson
// Copyright 2025 Andrew Donelson

import React, { useState } from 'react';
import { 
  RefreshCw, 
  LogIn, 
  LogOut, 
  Key, 
  Settings, 
  Edit, 
  CheckCircle2, 
  AlertTriangle,
  FolderOpen,
  Download,
  Filter
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { cn, formatDate } from '@/lib/utils';

// Mock activity data
const mockActivities = [
  {
    id: '1',
    type: 'login',
    description: 'Account login via MetaMask',
    timestamp: new Date('2025-03-17T08:30:00'),
    ip: '192.168.1.1',
    device: 'Chrome on Windows',
    status: 'success'
  },
  {
    id: '2',
    type: 'task_create',
    description: 'Created task "Implement user profile page"',
    timestamp: new Date('2025-03-16T14:45:00'),
    status: 'success'
  },
  {
    id: '3',
    type: 'task_complete',
    description: 'Completed task "Set up project repository"',
    timestamp: new Date('2025-03-15T11:20:00'),
    status: 'success'
  },
  {
    id: '4',
    type: 'security',
    description: 'Changed security settings',
    timestamp: new Date('2025-03-14T09:15:00'),
    ip: '192.168.1.1',
    device: 'Chrome on Windows',
    status: 'success'
  },
  {
    id: '5',
    type: 'login',
    description: 'Failed login attempt',
    timestamp: new Date('2025-03-13T16:50:00'),
    ip: '45.123.45.67',
    device: 'Unknown device',
    status: 'failed'
  },
  {
    id: '6',
    type: 'wallet',
    description: 'Connected wallet 0x71C76...d8976F',
    timestamp: new Date('2025-03-12T10:05:00'),
    status: 'success'
  },
  {
    id: '7',
    type: 'profile',
    description: 'Updated profile information',
    timestamp: new Date('2025-03-10T13:40:00'),
    status: 'success'
  },
  {
    id: '8',
    type: 'export',
    description: 'Downloaded task data',
    timestamp: new Date('2025-03-08T15:30:00'),
    ip: '192.168.1.1',
    device: 'Chrome on Windows',
    status: 'success'
  },
];

// Mock blockchain transaction data
const mockTransactions = [
  {
    id: 'tx1',
    hash: '0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t',
    description: 'Create task "Research Web3 storage options"',
    timestamp: new Date('2025-03-16T09:25:00'),
    gas: '0.0012 ETH',
    status: 'confirmed',
    confirmations: 12
  },
  {
    id: 'tx2',
    hash: '0x2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1a',
    description: 'Complete task "Set up development environment"',
    timestamp: new Date('2025-03-15T14:10:00'),
    gas: '0.0009 ETH',
    status: 'confirmed',
    confirmations: 24
  },
  {
    id: 'tx3',
    hash: '0x3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1a2b',
    description: 'Update task priority',
    timestamp: new Date('2025-03-13T11:30:00'),
    gas: '0.0005 ETH',
    status: 'confirmed',
    confirmations: 36
  },
  {
    id: 'tx4',
    hash: '0x4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1a2b3c',
    description: 'Register username "andrew"',
    timestamp: new Date('2025-03-10T16:45:00'),
    gas: '0.0018 ETH',
    status: 'confirmed',
    confirmations: 48
  },
];

export const ActivityHistory: React.FC = () => {
  const [currentTab, setCurrentTab] = useState('activity');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredActivities, setFilteredActivities] = useState(mockActivities);
  const [filteredTransactions, setFilteredTransactions] = useState(mockTransactions);

  // Function to get icon based on activity type
  const getActivityIcon = (type: string, status: string) => {
    if (status === 'failed') {
      return <AlertTriangle className="h-4 w-4 text-destructive" />;
    }
    
    switch (type) {
      case 'login':
        return <LogIn className="h-4 w-4 text-blue-500" />;
      case 'logout':
        return <LogOut className="h-4 w-4 text-gray-500" />;
      case 'security':
        return <Key className="h-4 w-4 text-yellow-500" />;
      case 'profile':
        return <Edit className="h-4 w-4 text-indigo-500" />;
      case 'wallet':
        return <Key className="h-4 w-4 text-green-500" />;
      case 'task_create':
        return <FolderOpen className="h-4 w-4 text-teal-500" />;
      case 'task_complete':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'export':
        return <Download className="h-4 w-4 text-purple-500" />;
      default:
        return <Settings className="h-4 w-4 text-gray-500" />;
    }
  };

  // Filter activities based on search query
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    
    if (query) {
      setFilteredActivities(
        mockActivities.filter(activity => 
          activity.description.toLowerCase().includes(query) ||
          activity.type.toLowerCase().includes(query)
        )
      );
      
      setFilteredTransactions(
        mockTransactions.filter(tx => 
          tx.description.toLowerCase().includes(query) ||
          tx.hash.toLowerCase().includes(query)
        )
      );
    } else {
      setFilteredActivities(mockActivities);
      setFilteredTransactions(mockTransactions);
    }
  };

  // Format time (e.g., "2:30 PM")
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Format transaction hash for display
  const formatTxHash = (hash: string) => {
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
  };

  // Reset filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setFilteredActivities(mockActivities);
    setFilteredTransactions(mockTransactions);
  };

  // Filter by specific types
  const filterByType = (type: string) => {
    setFilteredActivities(
      mockActivities.filter(activity => activity.type === type)
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div>
            <CardTitle>Activity History</CardTitle>
            <CardDescription>
              Review your recent account activities and blockchain transactions.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Input
                placeholder="Search activities..."
                value={searchQuery}
                onChange={handleSearch}
                className="h-9 w-full md:w-60"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-9 w-9 rounded-l-none"
                  onClick={handleResetFilters}
                >
                  <span className="sr-only">Clear search</span>
                  <span>×</span>
                </Button>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9">
                  <Filter className="h-4 w-4" />
                  <span className="sr-only">Filter</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setFilteredActivities(mockActivities)}>
                  All Activities
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => filterByType('login')}>
                  Login Events
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => filterByType('task_create')}>
                  Task Creation
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => filterByType('task_complete')}>
                  Task Completion
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => filterByType('security')}>
                  Security Events
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="activity" value={currentTab} onValueChange={setCurrentTab}>
          <TabsList className="mb-4 w-full">
            <TabsTrigger value="activity" className="flex-1">Account Activity</TabsTrigger>
            <TabsTrigger value="transactions" className="flex-1">Blockchain Transactions</TabsTrigger>
          </TabsList>
          
          <TabsContent value="activity" className="space-y-4">
            {filteredActivities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="rounded-full bg-muted p-3">
                  <RefreshCw className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="mt-4 text-lg font-medium">No activities found</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {searchQuery 
                    ? `No results match "${searchQuery}"`
                    : "You don't have any recent activities"
                  }
                </p>
                {searchQuery && (
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={handleResetFilters}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            ) : (
              filteredActivities.map((activity, index) => (
                <React.Fragment key={activity.id}>
                  <div className="flex items-start space-x-4">
                    <div className="mt-0.5 rounded-full bg-muted p-2">
                      {getActivityIcon(activity.type, activity.status)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{activity.description}</p>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-xs",
                              activity.status === 'success' 
                                ? "border-green-500/50 text-green-500" 
                                : "border-destructive/50 text-destructive"
                            )}
                          >
                            {activity.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{formatTime(activity.timestamp)}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span>{formatDate(activity.timestamp)}</span>
                        {activity.ip && <span>IP: {activity.ip}</span>}
                        {activity.device && <span>{activity.device}</span>}
                      </div>
                    </div>
                  </div>
                  {index < filteredActivities.length - 1 && <Separator />}
                </React.Fragment>
              ))
            )}
          </TabsContent>
          
          <TabsContent value="transactions" className="space-y-4">
            {filteredTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="rounded-full bg-muted p-3">
                  <RefreshCw className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="mt-4 text-lg font-medium">No transactions found</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {searchQuery 
                    ? `No results match "${searchQuery}"`
                    : "You don't have any blockchain transactions"
                  }
                </p>
                {searchQuery && (
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={handleResetFilters}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            ) : (
              filteredTransactions.map((tx, index) => (
                <React.Fragment key={tx.id}>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{tx.description}</p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                          <span className="font-mono text-muted-foreground">{formatTxHash(tx.hash)}</span>
                          <Badge 
                            variant="outline" 
                            className="border-green-500/50 text-green-500"
                          >
                            {tx.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm">{formatTime(tx.timestamp)}</div>
                        <div className="text-xs text-muted-foreground">{formatDate(tx.timestamp)}</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-3">
                        <span>Gas fee: {tx.gas}</span>
                        <span>Confirmations: {tx.confirmations}</span>
                      </div>
                      <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                        View on Etherscan
                      </Button>
                    </div>
                  </div>
                  {index < filteredTransactions.length - 1 && <Separator />}
                </React.Fragment>
              ))
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};