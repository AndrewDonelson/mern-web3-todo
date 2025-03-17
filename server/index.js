// file: ./server/index.js
// description: Main entry point for the server-side code
// module: server
// author: Andrew Donelson
// license: MIT
// copyright: 2025, Andrew Donelson

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { Web3 } = require('web3');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
require('dotenv').config();

// Initialize express app
const app = express();

// Security and optimization middleware
app.use(helmet()); // Helps secure Express apps with various HTTP headers
app.use(compression()); // Compress responses
app.use(morgan('combined')); // HTTP request logger

// Basic middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB connection with retry logic
const connectDB = async () => {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/web3todo';
  const MAX_RETRIES = 5;
  let retries = 0;
  
  while (retries < MAX_RETRIES) {
    try {
      await mongoose.connect(MONGODB_URI);
      console.log('MongoDB connected successfully');
      return;
    } catch (err) {
      retries++;
      console.error(`MongoDB connection attempt ${retries} failed:`, err.message);
      // Wait before trying again - exponential backoff
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
    }
  }
  
  console.error('Failed to connect to MongoDB after maximum retries');
  process.exit(1);
};

connectDB();

// Connect to blockchain with error handling
let web3;
try {
  const BLOCKCHAIN_URI = process.env.BLOCKCHAIN_URI || 'http://localhost:8545';
  web3 = new Web3(BLOCKCHAIN_URI);
  console.log('Web3 connected to', BLOCKCHAIN_URI);
} catch (error) {
  console.error('Failed to connect to blockchain:', error.message);
}

// Load the compiled contract with error handling
let TodoListContract;
try {
  const TodoList = require('../build/contracts/TodoList.json');
  const networkId = process.env.NETWORK_ID || '5777'; // Default Ganache network ID
  
  const deployedNetwork = TodoList.networks[networkId];
  if (!deployedNetwork) {
    throw new Error(`Contract not deployed to network ID ${networkId}`);
  }
  
  TodoListContract = new web3.eth.Contract(
    TodoList.abi,
    deployedNetwork.address
  );
  
  console.log('Contract loaded at address:', deployedNetwork.address);
} catch (error) {
  console.error('Failed to load contract:', error.message);
}

// Define models
const User = mongoose.model('User', {
  address: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true 
  },
  name: { 
    type: String, 
    required: true,
    trim: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Routes
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    web3: web3 ? 'connected' : 'disconnected',
    contract: TodoListContract ? 'loaded' : 'not loaded'
  });
});

// User routes
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find().select('-__v');
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ message: 'Server error while fetching users' });
  }
});

app.post('/api/users', async (req, res) => {
  const { address, name } = req.body;
  
  // Validation
  if (!address || !name) {
    return res.status(400).json({ message: 'Address and name are required' });
  }
  
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ address });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this address already exists' });
    }
    
    const user = new User({ address, name });
    const newUser = await user.save();
    res.status(201).json(newUser);
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({ message: 'Server error while creating user' });
  }
});

// Contract interaction routes
app.get('/api/tasks', async (req, res) => {
  if (!TodoListContract) {
    return res.status(503).json({ message: 'Contract not available' });
  }
  
  try {
    const taskCount = await TodoListContract.methods.taskCount().call();
    const tasks = [];
    
    for (let i = 1; i <= taskCount; i++) {
      const task = await TodoListContract.methods.tasks(i).call();
      tasks.push({
        id: task.id,
        content: task.content,
        completed: task.completed,
        owner: task.owner
      });
    }
    
    res.json(tasks);
  } catch (err) {
    console.error('Error fetching tasks:', err);
    res.status(500).json({ message: 'Error fetching tasks from blockchain' });
  }
});

// Production setup - Serve static assets if in production
if (process.env.NODE_ENV === 'production') {
  // Set static folder
  app.use(express.static(path.join(__dirname, '../client/build')));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/build', 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  // Close server & exit process
  server.close(() => process.exit(1));
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    mongoose.connection.close(false, () => {
      process.exit(0);
    });
  });
});