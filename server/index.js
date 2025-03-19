// file: ./server/index.js
// description: Main entry point for the server-side code
// module: server
// author: Andrew Donelson
// license: MIT
// copyright: 2025, Andrew Donelson

const express = require('express');
const cors = require('cors');
const { Web3 } = require('web3');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const { initialize, shutdown } = require('./init');
const { User } = require('./models'); // Import models from models directory
require('dotenv').config();

// Initialize express app
const app = express();

// Security and optimization middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));

// Basic middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global Web3 instance
let web3;
let contracts = {};

// Initialize system and connect to services
const startupSystem = async () => {
  try {
    // Connect to blockchain
    const BLOCKCHAIN_URI = process.env.BLOCKCHAIN_URI || 'http://localhost:7545';
    web3 = new Web3(BLOCKCHAIN_URI);
    console.log('Web3 connected to', BLOCKCHAIN_URI);
    
    // Initialize MongoDB and other services via init.js
    await initialize(web3);
    
    // Load contracts
    await loadContracts();
    
    // Make web3 and contracts available globally
    global.web3 = web3;
    global.contracts = contracts;
    
  } catch (error) {
    console.error('System startup failed:', error);
    process.exit(1);
  }
};

// Load blockchain contracts
const loadContracts = async () => {
  try {
    // Load TodoList contract
    const TodoList = require('../build/contracts/TodoList.json');
    
    // Get network ID from chain
    const networkId = await web3.eth.net.getId();
    console.log(`Connected to network ID: ${networkId}`);
    
    // Try to get deployment info for the connected network
    const deployedNetwork = TodoList.networks[networkId.toString()];
    if (!deployedNetwork) {
      console.warn(`TodoList contract not deployed to detected network ID ${networkId}`);
      return;
    }
    
    // Create contract instance
    contracts.TodoList = new web3.eth.Contract(
      TodoList.abi,
      deployedNetwork.address
    );
    
    console.log('TodoList contract loaded at address:', deployedNetwork.address);
    
    // Load DBVerification contract if exists
    try {
      const DBVerification = require('../build/contracts/DBVerification.json');
      const dbVerificationNetwork = DBVerification.networks[networkId.toString()];
      
      if (dbVerificationNetwork) {
        contracts.DBVerification = new web3.eth.Contract(
          DBVerification.abi,
          dbVerificationNetwork.address
        );
        console.log('DBVerification contract loaded at address:', dbVerificationNetwork.address);
      } else {
        console.warn(`DBVerification contract not deployed to network ID ${networkId}`);
      }
    } catch (error) {
      console.warn('DBVerification contract not available:', error.message);
    }
    
  } catch (error) {
    console.error('Failed to load contracts:', error.message);
  }
};

// Routes
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    web3: web3 ? 'connected' : 'disconnected',
    contracts: Object.keys(contracts)
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
  if (!contracts.TodoList) {
    return res.status(503).json({ message: 'TodoList contract not available' });
  }
  
  try {
    const taskCount = await contracts.TodoList.methods.taskCount().call();
    const tasks = [];
    
    for (let i = 1; i <= taskCount; i++) {
      const task = await contracts.TodoList.methods.tasks(i).call();
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

// Start the system and server
(async () => {
  await startupSystem();
  
  // Start server
  const PORT = process.env.PORT || 5000;
  const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  
  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
    server.close(() => process.exit(1));
  });
  
  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(async () => {
      console.log('HTTP server closed');
      await shutdown();
      process.exit(0);
    });
  });
})();