// file: client/src/pages/Todo/Detail/index.tsx
// description: Detailed view for a single todo item with edit capability
// module: Client
// License: MIT
// Author: Andrew Donelson
// Copyright 2025 Andrew Donelson

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarClock,
  Clock,
  Edit,
  Link2,
  Save,
  Trash2,
  UserCircle
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { DashboardLayout } from '@/components/Dashboard/DashboardLayout';
import { formatDate } from '@/lib/utils';

// Single task mock data
const mockTask = {
  id: '1',
  title: 'Complete smart contract testing',
  description: 'Finish all test cases for the TodoList smart contract including edge cases for task creation, completion, and deletion. Make sure to test gas optimization as well.',
  status: 'in_progress',
  priority: 'high',
  createdAt: '2025-03-14T10:00:00Z',
  dueDate: '2025-03-18T23:59:59Z',
  category: 'Development',
  isCompleted: false,
  assignedTo: null,
  transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  blockNumber: 123456,
  lastUpdated: '2025-03-15T08:30:00Z',
  comments: [
    {
      id: 1,
      author: 'Alice',
      content: 'Don\'t forget to test the access control mechanisms.',
      timestamp: '2025-03-14T14:22:00Z',
    },
    {
      id: 2,
      author: 'Bob',
      content: 'I\'ve started working on the gas optimization tests.',
      timestamp: '2025-03-15T09:15:00Z',
    }
  ]
};

const TodoDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // State variables
  const [task, setTask] = useState(mockTask);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Edited task state
  const [editedTask, setEditedTask] = useState(mockTask);
  
  // Fetch task data
  useEffect(() => {
    // Simulating API fetch
    const fetchTask = async () => {
      try {
        // In a real app, you would fetch the task data from your API or blockchain
        // const response = await fetch(`/api/tasks/${id}`);
        // const data = await response.json();
        
        setIsLoading(false);
        // For now we'll use the mock data
        // setTask(data);
        // setEditedTask(data);
      } catch (error) {
        console.error('Error fetching task:', error);
        setIsLoading(false);
        toast({
          title: 'Error',
          description: 'Failed to load task details. Please try again.',
          variant: 'destructive',
        });
      }
    };
    
    fetchTask();
  }, [id, toast]);
  
  // Handle editing of task
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setEditedTask(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle select dropdown changes
  const handleSelectChange = (name: string, value: string) => {
    setEditedTask(prev => ({ ...prev, [name]: value }));
  };
  
  // Toggle task completion status
  const handleToggleComplete = async () => {
    try {
      // In a real app, you would call your API or blockchain
      // await toggleTaskCompletion(id);
      
      // Update local state
      const updatedTask = { 
        ...task, 
        isCompleted: !task.isCompleted,
        status: !task.isCompleted ? 'completed' : 'in_progress'
      };
      
      setTask(updatedTask);
      setEditedTask(updatedTask);
      
      toast({
        title: updatedTask.isCompleted ? 'Task completed' : 'Task reopened',
        description: updatedTask.isCompleted 
          ? 'The task has been marked as completed.'
          : 'The task has been reopened.',
        variant: 'success',
      });
    } catch (error) {
      console.error('Error toggling task completion:', error);
      toast({
        title: 'Error',
        description: 'Failed to update task status. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  // Save edited task
  const handleSaveTask = async () => {
    try {
      // Validate task data
      if (!editedTask.title.trim()) {
        toast({
          title: 'Validation Error',
          description: 'Task title is required.',
          variant: 'destructive',
        });
        return;
      }
      
      // In a real app, you would call your API or blockchain
      // await updateTask(id, editedTask);
      
      // Update local state and exit edit mode
      setTask(editedTask);
      setIsEditing(false);
      
      toast({
        title: 'Task updated',
        description: 'Task details have been successfully updated.',
        variant: 'success',
      });
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: 'Error',
        description: 'Failed to update task. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  // Delete task
  const handleDeleteTask = async () => {
    try {
      // In a real app, you would call your API or blockchain
      // await deleteTask(id);
      
      toast({
        title: 'Task deleted',
        description: 'The task has been permanently deleted.',
        variant: 'success',
      });
      
      // Navigate back to tasks list
      navigate('/todos');
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete task. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  // Format date for display
  const formatTaskDate = (dateString: string) => {
    try {
      return formatDate(new Date(dateString));
    } catch (e) {
      return 'Invalid date';
    }
  };
  
  // Get appropriate priority styling
  const getPriorityBadgeClass = (priority: string) => {
    switch (priority.toLowerCase()) {
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
  
  // Get status badge styling
  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
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
  
  // Format status for display
  const formatStatus = (status: string) => {
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-96 items-center justify-center">
          <div className="text-center">
            <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="text-muted-foreground">Loading task details...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center">
        <Button 
          variant="ghost" 
          className="mr-4"
          onClick={() => navigate('/todos')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Tasks
        </Button>
        
        <h1 className="flex-1 text-2xl font-bold md:text-3xl">
          {isEditing ? 'Edit Task' : 'Task Details'}
        </h1>
        
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button variant="ghost" onClick={() => {
                setIsEditing(false);
                setEditedTask(task);
              }}>
                Cancel
              </Button>
              <Button onClick={handleSaveTask}>
                <Save className="mr-2 h-4 w-4" />
                Save
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
              
              <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the task
                      from the blockchain and remove it from your list.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteTask} className="bg-destructive text-destructive-foreground">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Task Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                {isEditing ? (
                  <Input
                    name="title"
                    value={editedTask.title}
                    onChange={handleInputChange}
                    className="mb-2 text-xl font-bold"
                  />
                ) : (
                  <CardTitle className="text-xl md:text-2xl">{task.title}</CardTitle>
                )}
                
                <CardDescription>
                  Created on {formatTaskDate(task.createdAt)}
                  {task.lastUpdated && task.lastUpdated !== task.createdAt && (
                    <> • Updated on {formatTaskDate(task.lastUpdated)}</>
                  )}
                </CardDescription>
              </div>
              
              <div>
                <Button 
                  variant={task.isCompleted ? "outline" : "default"}
                  onClick={handleToggleComplete}
                >
                  {task.isCompleted ? 'Reopen Task' : 'Mark Complete'}
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div>
              <h3 className="mb-2 font-medium">Description</h3>
              {isEditing ? (
                <Textarea
                  name="description"
                  value={editedTask.description}
                  onChange={handleInputChange}
                  rows={5}
                  className="resize-none"
                />
              ) : (
                <p className="whitespace-pre-line text-muted-foreground">
                  {task.description || "No description provided."}
                </p>
              )}
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <h3 className="mb-2 font-medium">Priority</h3>
                {isEditing ? (
                  <Select
                    value={editedTask.priority}
                    onValueChange={(value) => handleSelectChange('priority', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant="outline" className={getPriorityBadgeClass(task.priority)}>
                    {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                  </Badge>
                )}
              </div>
              
              <div>
                <h3 className="mb-2 font-medium">Status</h3>
                {isEditing ? (
                  <Select
                    value={editedTask.status}
                    onValueChange={(value) => handleSelectChange('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not_started">Not Started</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant="outline" className={getStatusBadgeClass(task.status)}>
                    {formatStatus(task.status)}
                  </Badge>
                )}
              </div>
              
              <div>
                <h3 className="mb-2 font-medium">Category</h3>
                {isEditing ? (
                  <Select
                    value={editedTask.category}
                    onValueChange={(value) => handleSelectChange('category', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Development">Development</SelectItem>
                      <SelectItem value="Design">Design</SelectItem>
                      <SelectItem value="Research">Research</SelectItem>
                      <SelectItem value="Management">Management</SelectItem>
                      <SelectItem value="Documentation">Documentation</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex items-center text-muted-foreground">
                    {task.category || "No category"}
                  </div>
                )}
              </div>
              
              <div>
                <h3 className="mb-2 font-medium">Due Date</h3>
                {isEditing ? (
                  <Input
                    type="date"
                    name="dueDate"
                    value={editedTask.dueDate.split('T')[0]}
                    onChange={handleInputChange}
                  />
                ) : (
                  <div className="flex items-center text-muted-foreground">
                    <CalendarClock className="mr-2 h-4 w-4" />
                    {formatTaskDate(task.dueDate)}
                  </div>
                )}
              </div>
              
              <div>
                <h3 className="mb-2 font-medium">Assigned To</h3>
                <div className="flex items-center text-muted-foreground">
                  <UserCircle className="mr-2 h-4 w-4" />
                  {task.assignedTo || "Unassigned"}
                </div>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col items-start">
            <h3 className="mb-2 font-medium">Comments ({task.comments.length})</h3>
            
            {task.comments.length > 0 ? (
              <div className="w-full space-y-4">
                {task.comments.map((comment) => (
                  <div key={comment.id} className="rounded-md border p-3">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="font-medium">{comment.author}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatTaskDate(comment.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{comment.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No comments yet.</p>
            )}
            
            {/* Add comment form - simplified for now */}
            <div className="mt-4 w-full">
              <Textarea
                placeholder="Add a comment..."
                className="mb-2 resize-none"
                rows={2}
              />
              <Button size="sm" disabled>Add Comment</Button>
            </div>
          </CardFooter>
        </Card>
        
        {/* Blockchain Information */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Blockchain Information</CardTitle>
              <CardDescription>
                Details about this task on the blockchain
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="mb-1 text-sm font-medium">Transaction Hash</h3>
                <div className="flex items-center gap-2 rounded-md bg-muted p-2">
                  <code className="text-xs">{task.transactionHash}</code>
                  <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                    <Link2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              <div>
                <h3 className="mb-1 text-sm font-medium">Block Number</h3>
                <div className="rounded-md bg-muted p-2">
                  <code className="text-xs">{task.blockNumber}</code>
                </div>
              </div>
              
              <div>
                <h3 className="mb-1 text-sm font-medium">Smart Contract</h3>
                <div className="flex items-center gap-2 rounded-md bg-muted p-2">
                  <code className="text-xs">0x1234...5678</code>
                  <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                    <Link2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="mb-2 text-sm font-medium">Activity Log</h3>
                <div className="space-y-2">
                  <div className="flex items-start gap-2 text-xs">
                    <Clock className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
                    <div>
                      <p>Task created by <span className="font-medium">You</span></p>
                      <p className="text-muted-foreground">{formatTaskDate(task.createdAt)}</p>
                    </div>
                  </div>
                  
                  {task.lastUpdated && task.lastUpdated !== task.createdAt && (
                    <div className="flex items-start gap-2 text-xs">
                      <Clock className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
                      <div>
                        <p>Task updated by <span className="font-medium">You</span></p>
                        <p className="text-muted-foreground">{formatTaskDate(task.lastUpdated)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Related Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">No related tasks found.</p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm" className="w-full">
                Link Task
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TodoDetail;