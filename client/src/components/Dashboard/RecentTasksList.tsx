// file: client/src/components/Dashboard/RecentTasksList.tsx
// description: List component displaying recent tasks on the dashboard
// module: Client
// License: MIT
// Author: Andrew Donelson
// Copyright 2025 Andrew Donelson

import React from 'react';
import { Calendar, Clock, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

// Mock task data for development
const mockTasks = [
  {
    id: '1',
    title: 'Complete smart contract testing',
    description: 'Finish all test cases for the TodoList smart contract',
    status: 'in_progress',
    priority: 'high',
    createdAt: '2025-03-14T10:00:00Z',
    dueDate: '2025-03-18T23:59:59Z',
    category: 'Development',
  },
  {
    id: '2',
    title: 'Create UI components for task list',
    description: 'Design and implement reusable components for displaying tasks',
    status: 'completed',
    priority: 'medium',
    createdAt: '2025-03-13T08:30:00Z',
    dueDate: '2025-03-15T23:59:59Z',
    category: 'Design',
  },
  {
    id: '3',
    title: 'Research IPFS integration options',
    description: 'Evaluate different libraries and methods for integrating IPFS storage',
    status: 'in_progress',
    priority: 'medium',
    createdAt: '2025-03-12T14:15:00Z',
    dueDate: '2025-03-20T23:59:59Z',
    category: 'Research',
  },
  {
    id: '4',
    title: 'Schedule team meeting for sprint planning',
    description: 'Coordinate with team members to plan next sprint',
    status: 'not_started',
    priority: 'low',
    createdAt: '2025-03-10T09:45:00Z',
    dueDate: '2025-03-16T10:00:00Z',
    category: 'Management',
  },
  {
    id: '5',
    title: 'Add gas optimization for contract functions',
    description: 'Review and optimize gas usage in smart contract functions',
    status: 'not_started',
    priority: 'high',
    createdAt: '2025-03-09T11:20:00Z',
    dueDate: '2025-03-22T23:59:59Z',
    category: 'Development',
  },
];

export const RecentTasksList: React.FC = () => {
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Get appropriate status style
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'not_started':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-400';
    }
  };

  // Get appropriate priority style
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-400';
    }
  };

  // Format status for display
  const formatStatus = (status: string) => {
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="flex flex-col space-y-4">
      {mockTasks.map((task, index) => (
        <React.Fragment key={task.id}>
          <div className="flex flex-col space-y-2">
            <div className="flex flex-col space-y-1 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
              <div className="flex items-center space-x-2">
                <div 
                  className={cn(
                    "h-3 w-3 rounded-full",
                    task.status === 'completed' ? 'bg-green-500' : 
                    task.status === 'in_progress' ? 'bg-blue-500' : 'bg-gray-400'
                  )}
                />
                <h3 className="font-medium leading-none">{task.title}</h3>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className={cn(getStatusColor(task.status))}>
                  {formatStatus(task.status)}
                </Badge>
                <Badge variant="outline" className={cn(getPriorityColor(task.priority))}>
                  {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                </Badge>
              </div>
            </div>
            
            <div className="mt-1 text-sm text-muted-foreground line-clamp-1">
              {task.description}
            </div>
            
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Tag className="h-3.5 w-3.5" />
                <span>{task.category}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                <span>Created {formatDate(task.createdAt)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                <span>Due {formatDate(task.dueDate)}</span>
              </div>
            </div>
          </div>
          
          {index < mockTasks.length - 1 && <Separator />}
        </React.Fragment>
      ))}
    </div>
  );
};