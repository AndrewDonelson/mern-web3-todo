// file: client/src/pages/Todo/TodoHome/index.tsx
// description: Main todo list page with filtering and task display
// module: Client
// License: MIT
// Author: Andrew Donelson
// Copyright 2025 Andrew Donelson

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Filter, Plus, Search, SlidersHorizontal, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger 
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { DashboardLayout } from '@/components/Dashboard/DashboardLayout';
import { CreateTaskDialog } from '@/components/Dashboard/CreateTaskDialog';
import { formatDistanceToNow } from '@/lib/utils';

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
    isCompleted: false,
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
    isCompleted: true,
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
    isCompleted: false,
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
    isCompleted: false,
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
    isCompleted: false,
  },
  {
    id: '6',
    title: 'Update project documentation',
    description: 'Add latest features and changes to project README',
    status: 'completed',
    priority: 'low',
    createdAt: '2025-03-08T16:45:00Z',
    dueDate: '2025-03-12T23:59:59Z',
    category: 'Documentation',
    isCompleted: true,
  },
  {
    id: '7',
    title: 'Add wallet connection error handling',
    description: 'Improve error messages when wallet connection fails',
    status: 'in_progress',
    priority: 'medium',
    createdAt: '2025-03-07T13:10:00Z',
    dueDate: '2025-03-15T23:59:59Z',
    category: 'Development',
    isCompleted: false,
  },
];

// Available filters
const priorities = ['All', 'High', 'Medium', 'Low'];
const categories = ['All', 'Development', 'Design', 'Research', 'Management', 'Documentation'];
const sortOptions = ['Created (Newest)', 'Created (Oldest)', 'Due Date (Soonest)', 'Priority (Highest)'];

const TodoHome: React.FC = () => {
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSort, setSelectedSort] = useState(sortOptions[0]);
  const [selectedTab, setSelectedTab] = useState('all');
  
  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  // Filter tasks based on current filters and search query
  const filteredTasks = mockTasks.filter(task => {
    // Filter by tab (All, Active, Completed)
    if (selectedTab === 'active' && task.isCompleted) return false;
    if (selectedTab === 'completed' && !task.isCompleted) return false;
    
    // Filter by search query
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    
    // Filter by priority
    if (selectedPriority !== 'All' && task.priority !== selectedPriority.toLowerCase()) return false;
    
    // Filter by category
    if (selectedCategory !== 'All' && task.category !== selectedCategory) return false;
    
    return true;
  });

  // Sort filtered tasks
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    switch (selectedSort) {
      case 'Created (Newest)':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'Created (Oldest)':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'Due Date (Soonest)':
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      case 'Priority (Highest)':
        const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      default:
        return 0;
    }
  });

  // Handle task completion toggle
  const handleToggleComplete = (taskId: string) => {
    // In a real app, you would update the task in the state and on the blockchain
    console.log(`Toggle completion for task ${taskId}`);
  };
  
  // Get priority badge styling
  const getPriorityBadge = (priority: string) => {
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

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between py-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Tasks</h1>
          <p className="text-muted-foreground">
            Manage and organize your tasks
          </p>
        </div>
        <Button onClick={() => setIsCreateTaskOpen(true)} className="gap-1">
          <Plus className="h-4 w-4" />
          <span>New Task</span>
        </Button>
      </div>

      {/* Filters & Search */}
      <Card className="mb-6">
        <CardContent className="p-4 sm:p-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search tasks..."
                className="pl-8"
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>
            
            <Select value={selectedPriority} onValueChange={setSelectedPriority}>
              <SelectTrigger>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <span>Priority: {selectedPriority}</span>
                </div>
              </SelectTrigger>
              <SelectContent>
                {priorities.map((priority) => (
                  <SelectItem key={priority} value={priority}>
                    {priority}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <span>Category: {selectedCategory}</span>
                </div>
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedSort} onValueChange={setSelectedSort}>
              <SelectTrigger>
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  <span>Sort By</span>
                </div>
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Task Tabs & List */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Tasks ({filteredTasks.length})</CardTitle>
            <Tabs 
              defaultValue="all" 
              value={selectedTab} 
              onValueChange={setSelectedTab}
              className="mt-2 sm:mt-0"
            >
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          {sortedTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <CheckCircle2 className="mb-4 h-12 w-12 text-muted-foreground/50" />
              <h3 className="mb-2 text-xl font-medium">No tasks found</h3>
              <p className="text-center text-muted-foreground">
                {searchQuery || selectedPriority !== 'All' || selectedCategory !== 'All'
                  ? "Try adjusting your filters to find what you're looking for."
                  : "You don't have any tasks yet. Create one to get started."}
              </p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setIsCreateTaskOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Task
              </Button>
            </div>
          ) : (
            <div>
              {sortedTasks.map((task, index) => (
                <React.Fragment key={task.id}>
                  <div className="flex items-start gap-4 px-4 py-3 sm:px-6 hover:bg-muted/50">
                    <Checkbox 
                      id={`task-${task.id}`}
                      checked={task.isCompleted}
                      onCheckedChange={() => handleToggleComplete(task.id)}
                      className="mt-1"
                    />
                    
                    <div className="flex-1 space-y-1">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2">
                          <label 
                            htmlFor={`task-${task.id}`}
                            className={`font-medium ${task.isCompleted ? 'line-through text-muted-foreground' : ''}`}
                          >
                            {task.title}
                          </label>
                          <Badge variant="outline" className={getPriorityBadge(task.priority)}>
                            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                          </Badge>
                        </div>
                        
                        <div className="mt-1 text-xs text-muted-foreground sm:mt-0">
                          Due {formatDistanceToNow(new Date(task.dueDate))}
                        </div>
                      </div>
                      
                      <p className={`text-sm ${task.isCompleted ? 'text-muted-foreground' : ''}`}>
                        {task.description}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {task.category}
                        </span>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="lucide lucide-more-horizontal"
                              >
                                <circle cx="12" cy="12" r="1" />
                                <circle cx="19" cy="12" r="1" />
                                <circle cx="5" cy="12" r="1" />
                              </svg>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem asChild>
                              <Link to={`/todos/${task.id}`}>View Details</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem>Edit Task</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive focus:text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />
                              <span>Delete Task</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                  
                  {index < sortedTasks.length - 1 && <Separator />}
                </React.Fragment>
              ))}
            </div>
          )}
        </CardContent>
        
        {sortedTasks.length > 0 && (
          <CardFooter className="flex items-center justify-between p-4 sm:p-6">
            <p className="text-sm text-muted-foreground">
              Showing {sortedTasks.length} of {mockTasks.length} tasks
            </p>
            <Button variant="outline" size="sm">
              Load More
            </Button>
          </CardFooter>
        )}
      </Card>

      {/* Create Task Dialog */}
      <CreateTaskDialog 
        open={isCreateTaskOpen} 
        onOpenChange={setIsCreateTaskOpen} 
      />
    </DashboardLayout>
  );
};

export default TodoHome;