// file: scripts/deploy-contracts.js
// description: Script to deploy smart contracts to development networks
// module: Scripts
// License: MIT
// Author: Andrew Donelson
// Copyright 2025 Andrew Donelson

const fs = require('fs');
const path = require('path');
const Web3 = require('web3');
require('dotenv').config();

// Load contract artifacts
const TodoListArtifact = require('../build/contracts/TodoList.json');
let DBVerificationArtifact;
try {
  DBVerificationArtifact = require('../build/contracts/DBVerification.json');
} catch (err) {
  console.log('DBVerification contract not compiled yet. Skipping...');
}

// Connect to the specified blockchain network
const web3 = new Web3(process.env.BLOCKCHAIN_URI || 'http://localhost:7545');

/**
 * Deploy the TodoList contract
 */
async function deployTodoList() {
  try {
    // Get network ID
    const networkId = await web3.eth.net.getId();
    console.log(`Deploying to network ID: ${networkId}`);
    
    // Get the contract's already deployed address (if any)
    const deployedNetwork = TodoListArtifact.networks[networkId];
    
    if (deployedNetwork) {
      console.log(`TodoList already deployed at ${deployedNetwork.address}`);
      return deployedNetwork.address;
    }
    
    // Get list of accounts
    const accounts = await web3.eth.getAccounts();
    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts found. Make sure your Ethereum client is running.');
    }
    console.log(`Using account: ${accounts[0]}`);
    
    // Deploy the contract
    console.log('Deploying TodoList contract...');
    const TodoList = new web3.eth.Contract(TodoListArtifact.abi);
    const todoListContract = await TodoList.deploy({
      data: TodoListArtifact.bytecode
    }).send({
      from: accounts[0], 
      gas: 3000000
    });
    
    console.log(`TodoList deployed at ${todoListContract.options.address}`);
    
    // Save deployment info to a file
    updateDeploymentInfo(networkId, 'TodoList', todoListContract.options.address);
    
    return todoListContract.options.address;
  } catch (error) {
    console.error('Error deploying TodoList contract:', error);
    throw error;
  }
}

/**
 * Deploy the DBVerification contract if it exists
 */
async function deployDBVerification() {
  // Skip if DBVerification is not compiled
  if (!DBVerificationArtifact) {
    console.log('Skipping DBVerification deployment as it is not compiled.');
    return null;
  }
  
  try {
    // Get network ID
    const networkId = await web3.eth.net.getId();
    
    // Get the contract's already deployed address (if any)
    const deployedNetwork = DBVerificationArtifact.networks[networkId];
    
    if (deployedNetwork) {
      console.log(`DBVerification already deployed at ${deployedNetwork.address}`);
      return deployedNetwork.address;
    }
    
    // Get list of accounts
    const accounts = await web3.eth.getAccounts();
    
    // Deploy the contract
    console.log('Deploying DBVerification contract...');
    const DBVerification = new web3.eth.Contract(DBVerificationArtifact.abi);
    const dbVerificationContract = await DBVerification.deploy({
      data: DBVerificationArtifact.bytecode
    }).send({
      from: accounts[0], 
      gas: 4000000
    });
    
    console.log(`DBVerification deployed at ${dbVerificationContract.options.address}`);
    
    // Save deployment info
    updateDeploymentInfo(networkId, 'DBVerification', dbVerificationContract.options.address);
    
    return dbVerificationContract.options.address;
  } catch (error) {
    console.error('Error deploying DBVerification contract:', error);
    return null;
  }
}

/**
 * Save deployment info to a file
 */
function updateDeploymentInfo(networkId, contractName, contractAddress) {
  const deploymentsPath = path.join(__dirname, '../deployments.json');
  let deployments = {};
  
  // Load existing deployments if file exists
  if (fs.existsSync(deploymentsPath)) {
    const fileContent = fs.readFileSync(deploymentsPath, 'utf8');
    try {
      deployments = JSON.parse(fileContent);
    } catch (error) {
      console.error('Error parsing deployments file:', error);
    }
  }
  
  // Update deployments
  if (!deployments[networkId]) {
    deployments[networkId] = {};
  }
  
  deployments[networkId][contractName] = contractAddress;
  
  // Save to file
  fs.writeFileSync(deploymentsPath, JSON.stringify(deployments, null, 2));
  console.log(`Deployment info saved to ${deploymentsPath}`);
  
  // Also update environment variables file
  updateEnvFile(contractName, contractAddress);
}

/**
 * Update .env file with contract addresses
 */
function updateEnvFile(contractName, contractAddress) {
  const envPath = path.join(__dirname, '../.env');
  let envContent = '';
  
  // Read existing .env file if it exists
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }
  
  // Create variable name based on contract name
  const envVarName = `${contractName.toUpperCase()}_CONTRACT_ADDRESS`;
  
  // Check if variable already exists in the file
  const regex = new RegExp(`^${envVarName}=.*$`, 'm');
  
  if (regex.test(envContent)) {
    // Update existing variable
    envContent = envContent.replace(regex, `${envVarName}=${contractAddress}`);
  } else {
    // Add new variable
    envContent += `\n${envVarName}=${contractAddress}`;
  }
  
  // Write the updated content back to .env file
  fs.writeFileSync(envPath, envContent);
  console.log(`Environment variable ${envVarName} set to ${contractAddress}`);
}

/**
 * Main function
 */
async function main() {
  console.log('Starting contract deployment...');
  
  try {
    await deployTodoList();
    await deployDBVerification();
    console.log('All deployments completed successfully.');
  } catch (error) {
    console.error('Error in deployment process:', error);
    process.exit(1);
  }
}

// Execute main function
main();