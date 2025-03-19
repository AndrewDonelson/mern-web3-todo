# MERN Web3 Todo App - Frontend Storage Documentation

## Table of Contents

1. [Storage Architecture Overview](#storage-architecture-overview)
2. [User Storage](#user-storage)
3. [Profile Storage](#profile-storage)
4. [Todo Storage](#todo-storage)
5. [Blockchain Verification](#blockchain-verification)
6. [Error Handling](#error-handling)
7. [Best Practices](#best-practices)

## Storage Architecture Overview

The MERN Web3 Todo App implements a hybrid storage architecture that combines MongoDB for off-chain data persistence with blockchain verification for data integrity. This system provides both the flexibility of traditional databases and the security benefits of blockchain technology.

### Core Components

1. **BaseStorage Service**: The foundation of the storage system that provides unified CRUD operations with blockchain verification capabilities.

2. **Specialized Storage Services**:
   - `UserStorage`: Manages user account data
   - `ProfileStorage`: Handles extended user profile information
   - `TodoStorage`: Manages todo items with specialized todo-specific operations

3. **Blockchain Verification Service**: Connects MongoDB documents with smart contracts to verify data integrity.

4. **DBVerification Smart Contract**: Stores hashes of MongoDB documents on the blockchain.

5. **BlockchainThrottler**: Manages rate limiting for blockchain operations to prevent excessive gas usage.

### Data Flow

1. Client makes API requests through the React frontend
2. Server receives requests and routes them to appropriate controllers
3. Controllers use storage services to interact with MongoDB
4. Storage services optionally verify data integrity with blockchain
5. Changes are persisted in MongoDB and verified on-chain

### Key Features

1. **Document Verification**: Each MongoDB document has a `blockchainVerification` field tracking its verification status.

2. **Integrity Checking**: Documents can be checked against blockchain-stored hashes to detect tampering.

3. **Batch Operations**: Supports verifying multiple documents in a single transaction for gas efficiency.

4. **Throttling & Rate Limiting**: Prevents excessive blockchain operations during high traffic.

5. **Error Handling**: Comprehensive error handling throughout the storage stack.

## User Storage

The `UserStorage` service manages user accounts and authentication. These functions are primarily accessed through the `authService` in the frontend.

### Available Operations

#### Authentication

```typescript
// Get a nonce for wallet signature
const nonce = await authService.getNonce(walletAddress);

// Register a new user
const userData = await authService.register({
  username: "username",
  walletAddress: "0x...",
  signature: "0x...",
  message: "Message that was signed"
});

// Login with wallet
const userData = await authService.login({
  walletAddress: "0x...",
  signature: "0x...",
  message: "Message that was signed"
});

// Logout
await authService.logout();
```

#### User Management

```typescript
// Get current authenticated user
const user = authService.getCurrentUser();

// Check if user is authenticated
const isAuthenticated = authService.isAuthenticated();

// Check if user is admin
const isAdmin = authService.isAdmin();

// Update user profile
const updatedUser = await authService.updateProfile({
  username: "newUsername",
  // other user fields...
});

// Verify authentication status
const isStillValid = await authService.verifyAuth();
```

### User Model

```typescript
interface AuthUser {
  id: string;
  username: string;
  walletAddress: string;
  isAdmin: boolean;
  createdAt: string;
  lastLogin: string;
  profileImageUrl?: string;
}
```

### Authentication Context Usage

```tsx
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { 
    user, 
    isLoading, 
    isAuthenticated, 
    login, 
    logout 
  } = useAuth();
  
  // Use these values and functions in your component
}
```

## Profile Storage

The `ProfileStorage` service manages extended user profile information. This includes personal details, preferences, and social links.

### Available Operations

```typescript
// API client is used to interact with the backend
import { apiClient } from '@/services/api';

// Get user profile
const profile = await apiClient.get('/api/profiles/' + walletAddress);

// Create or update profile
const updatedProfile = await apiClient.post('/api/profiles', {
  fullName: "Full Name",
  bio: "User bio...",
  avatarUrl: "https://...",
  socialLinks: {
    website: "https://...",
    twitter: "https://twitter.com/...",
    github: "https://github.com/...",
  },
  preferences: {
    theme: "system", // "light", "dark", "system"
    emailNotifications: false,
    displayWalletAddress: true
  }
});

// Update profile preferences only
const updatedPreferences = await apiClient.patch('/api/profiles/preferences', {
  theme: "light",
  emailNotifications: false
});

// Get full profile with user details
const fullProfile = await apiClient.get('/api/profiles/full/' + walletAddress);
```

### Profile Model

```typescript
interface Profile {
  walletAddress: string;
  fullName?: string;
  bio?: string;
  avatarUrl?: string;
  coverImageUrl?: string;
  socialLinks?: {
    website?: string;
    twitter?: string;
    github?: string;
    linkedin?: string;
  };
  preferences: {
    theme: 'light' | 'dark' | 'system';
    emailNotifications: boolean;
    displayWalletAddress: boolean;
  };
  blockchainVerification?: {
    isVerified: boolean;
    lastVerifiedAt?: string;
    transactionHash?: string;
    verificationHash?: string;
  };
  createdAt: string;
  updatedAt: string;
}
```

## Todo Storage

The `TodoStorage` service manages todo items with specialized todo-specific operations. It supports advanced features like collaborators, categories, and blockchain verification.

### Available Operations

```typescript
// API client is used to interact with the backend
import { apiClient } from '@/services/api';

// Get todos owned by current user
const todos = await apiClient.get('/api/todos');

// Get todos with filters
const filteredTodos = await apiClient.get('/api/todos', {
  params: {
    completed: false, // filter by completion status
    category: "work", // filter by category
    priority: "high", // filter by priority
    tag: "important", // filter by tag
    search: "keyword", // search in title and description
    includeArchived: false // include archived todos
  }
});

// Get todos where user is a collaborator
const collaborativeTodos = await apiClient.get('/api/todos/collaborative');

// Create a new todo
const newTodo = await apiClient.post('/api/todos', {
  title: "Todo item title",
  description: "Detailed description...",
  category: "work", // default: "general"
  priority: "medium", // "low", "medium", "high"
  dueDate: "2025-04-15T14:00:00Z", // ISO date string
  tags: ["important", "meeting"]
});

// Get a specific todo by ID
const todo = await apiClient.get(`/api/todos/${todoId}`);

// Update a todo
const updatedTodo = await apiClient.put(`/api/todos/${todoId}`, {
  title: "Updated title",
  description: "Updated description",
  priority: "high"
});

// Toggle completion status
const toggledTodo = await apiClient.patch(`/api/todos/${todoId}/toggle`);

// Add a collaborator
const todoWithCollaborator = await apiClient.post(`/api/todos/${todoId}/collaborators`, {
  collaboratorAddress: "0x...",
  permissions: "write" // "read", "write", "admin"
});

// Remove a collaborator
await apiClient.delete(`/api/todos/${todoId}/collaborators/${collaboratorAddress}`);

// Add a tag
const todoWithTag = await apiClient.post(`/api/todos/${todoId}/tags`, {
  tag: "newTag"
});

// Remove a tag
await apiClient.delete(`/api/todos/${todoId}/tags/${tag}`);

// Archive a todo
const archivedTodo = await apiClient.patch(`/api/todos/${todoId}/archive`);

// Restore an archived todo
const restoredTodo = await apiClient.patch(`/api/todos/${todoId}/restore`);

// Delete a todo
await apiClient.delete(`/api/todos/${todoId}`);

// Add an attachment
const todoWithAttachment = await apiClient.post(`/api/todos/${todoId}/attachments`, {
  name: "document.pdf",
  url: "ipfs://...", // or other URL
  contentType: "application/pdf",
  size: 1024 // size in bytes
});

// Remove an attachment
await apiClient.delete(`/api/todos/${todoId}/attachments/${attachmentId}`);

// Get user todo statistics
const stats = await apiClient.get('/api/todos/stats');

// Verify a todo on the blockchain
const verificationResult = await apiClient.post(`/api/todos/${todoId}/verify`);

// Check a todo's blockchain integrity
const integrityResult = await apiClient.get(`/api/todos/${todoId}/integrity`);
```

### Todo Model

```typescript
interface Todo {
  _id: string;
  ownerAddress: string;
  title: string;
  description?: string;
  completed: boolean;
  category: string;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  completedAt?: string;
  tags: string[];
  collaborators: {
    address: string;
    permissions: 'read' | 'write' | 'admin';
    addedAt: string;
  }[];
  attachments: {
    _id: string;
    name: string;
    url: string;
    contentType: string;
    size: number;
    addedAt: string;
  }[];
  contractInfo?: {
    taskId?: number;
    transactionHash?: string;
    blockNumber?: number;
  };
  blockchainVerification?: {
    isVerified: boolean;
    lastVerifiedAt?: string;
    transactionHash?: string;
    verificationHash?: string;
  };
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  history: {
    field: string;
    oldValue: any;
    newValue: any;
    changedBy: string;
    changedAt: string;
  }[];
}

interface TodoStats {
  total: number;
  completed: number;
  inProgress: number;
  overdue: number;
  completionRate: number;
  byCategory: Record<string, number>;
  byPriority: Record<string, number>;
  topTags: { tag: string; count: number }[];
}
```

## Blockchain Verification

The system provides blockchain verification for critical data, ensuring data integrity and tamper resistance. This functionality is accessible through the `web3Service` in the frontend.

### Available Operations

```typescript
import { web3Service } from '@/services/web3.service';

// Check if Web3 is available
const isWeb3Available = web3Service.isWeb3Available();

// Connect to wallet
const accounts = await web3Service.connect();

// Check if wallet is connected
const isConnected = web3Service.isConnected();

// Get connected accounts
const connectedAccounts = web3Service.getAccounts();

// Sign a message
const signature = await web3Service.signMessage("Message to sign");

// Verify a document on the blockchain
const verificationResult = await web3Service.verifyDocumentOnBlockchain(
  "todos", // tableId
  todoId,   // recordId
  JSON.stringify(todo) // data to verify
);

// Check verification result
if (verificationResult.valid) {
  console.log("Document is verified and unchanged");
} else {
  console.log("Document has been tampered with!");
}

// Get current network information
const networkId = await web3Service.getNetworkId();
```

### Blockchain Verification Events

You can subscribe to blockchain events to be notified of account or network changes:

```typescript
// Add account changed listener
web3Service.addAccountsChangedListener((accounts) => {
  console.log("Accounts changed:", accounts);
});

// Add chain changed listener
web3Service.addChainChangedListener((chainId) => {
  console.log("Chain changed:", chainId);
});

// Remove listeners when component unmounts
useEffect(() => {
  return () => {
    web3Service.removeAccountsChangedListener(handleAccountsChanged);
    web3Service.removeChainChangedListener(handleChainChanged);
  };
}, []);
```

## Error Handling

The storage system includes comprehensive error handling. Here's how errors are handled in the frontend services:

### API Client Error Handling

```typescript
// The apiClient automatically handles errors and provides appropriate responses
try {
  const data = await apiClient.get('/api/todos');
} catch (error) {
  // Error is already logged by the API client
  // Handle specific error cases if needed
  if (error.response?.status === 404) {
    // Handle not found error
  }
}
```

### Authentication Error Handling

```typescript
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

function LoginComponent() {
  const { login } = useAuth();
  const { toast } = useToast();
  
  const handleLogin = async () => {
    try {
      await login(walletAddress);
    } catch (error) {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };
}
```

### Web3 Error Handling

```typescript
try {
  await web3Service.connect();
} catch (error) {
  if (error.code === 4001) {
    // User rejected request
    console.log("Please connect your wallet to use this feature");
  } else {
    // Other errors
    console.error("Wallet connection error:", error.message);
  }
}
```

## Best Practices

1. **Always Use Services**: Interact with backend storage through the provided services rather than making direct API calls.

2. **Error Handling**: Always wrap API calls in try/catch blocks to handle potential errors gracefully.

3. **Wallet Connection**: Verify wallet connection before attempting to perform operations that require it.

4. **Verification Status**: Check blockchain verification status when displaying sensitive data to ensure integrity.

5. **Optimistic Updates**: Implement optimistic UI updates for better user experience, but verify changes with the server.

6. **Caching**: Use local caching where appropriate to reduce server load and improve performance.

7. **Batch Operations**: When possible, use batch operations for blockchain verification to reduce gas costs.

8. **Security**: Never expose private keys or sensitive data in the frontend code.

9. **Loading States**: Always handle loading states to provide feedback to users during asynchronous operations.

10. **Cleanup**: Remove event listeners and subscriptions when components unmount to prevent memory leaks.
