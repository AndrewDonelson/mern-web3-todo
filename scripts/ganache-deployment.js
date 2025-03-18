// file: scripts/ganache-deployment.js
// description: Script to ensure Ganache is running and contracts are correctly deployed
// module: Scripts
// License: MIT
// Author: Andrew Donelson
// Copyright 2025 Andrew Donelson

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const Web3 = require('web3');

// Configuration
const GANACHE_PORT = 8545;
const GANACHE_HOST = 'localhost';
const NETWORK_ID = 1337;
const MNEMONIC = 'laugh cabbage leisure stable dwarf donate near provide cannon venture silver achieve';

/**
 * Start Ganache blockchain
 * @returns {Promise<void>}
 */
function startGanache() {
  return new Promise((resolve, reject) => {
    console.log('Starting Ganache blockchain...');
    
    const ganachePath = path.join(process.cwd(), 'node_modules/.bin/ganache-cli');
    
    const ganacheProcess = spawn(ganachePath, [
      '-p', GANACHE_PORT.toString(), 
      '-i', NETWORK_ID.toString(),
      '-m', `"${MNEMONIC}"`,
      '-a', '10',
      '-e', '1000'
    ], { 
      stdio: 'pipe',
      shell: true 
    });

    ganacheProcess.stdout.on('data', (data) => {
      console.log(`Ganache: ${data}`);
    });

    ganacheProcess.stderr.on('data', (data) => {
      console.error(`Ganache Error: ${data}`);
    });

    ganacheProcess.on('error', (error) => {
      console.error('Ganache process error:', error);
      reject(error);
    });

    // Wait for Ganache to start
    setTimeout(resolve, 2000);
  });
}

/**
 * Get first account from Ganache
 * @returns {Promise<string>} - First account address
 */
async function getFirstAccount() {
  const web3 = new Web3(`http://${GANACHE_HOST}:${GANACHE_PORT}`);
  const accounts = await web3.eth.getAccounts();
  return accounts[0];
}

/**
 * Update Truffle configuration
 * @param {string} defaultAccount - Default account to use
 */
function updateTruffleConfig(defaultAccount) {
  const truffleConfigPath = path.join(__dirname, '../truffle-config.js');
  let truffleConfig = fs.readFileSync(truffleConfigPath, 'utf8');

  // Ensure network is correctly configured
  const networkConfig = `
    development: {
      host: "127.0.0.1",
      port: ${GANACHE_PORT},
      network_id: ${NETWORK_ID},
      from: "${defaultAccount}", // First generated account
      gas: 6721975,
      gasPrice: 20000000000
    }`;

  // Replace or add network configuration
  if (truffleConfig.includes('development:')) {
    truffleConfig = truffleConfig.replace(/development:[\s\S]*?}(\s*,|\s*$)/, networkConfig + '$1');
  } else {
    truffleConfig = truffleConfig.replace(
      /networks:\s*{/,
      `networks: {\n    ${networkConfig}`
    );
  }

  // Remove any double commas or trailing commas
  truffleConfig = truffleConfig.replace(/,\s*,/g, ',').replace(/,\s*}/g, '}');

  fs.writeFileSync(truffleConfigPath, truffleConfig);
  console.log('Updated Truffle configuration');
}

/**
 * Deploy contracts
 */
function deployContracts() {
  console.log('Compiling and migrating contracts...');
  try {
    execSync('npx truffle compile', { stdio: 'inherit' });
    execSync('npx truffle migrate --reset --network development', { stdio: 'inherit' });
    console.log('Contracts deployed successfully!');
  } catch (error) {
    console.error('Contract deployment failed:', error);
    process.exit(1);
  }
}

/**
 * Main deployment process
 */
async function main() {
  try {
    // Start Ganache
    await startGanache();

    // Get first account
    const firstAccount = await getFirstAccount();
    console.log(`First account retrieved: ${firstAccount}`);

    // Update Truffle configuration with first account
    updateTruffleConfig(firstAccount);

    // Deploy contracts
    deployContracts();

    console.log('Deployment completed successfully');
  } catch (error) {
    console.error('Deployment process failed:', error);
    process.exit(1);
  }
}

// Run the deployment
main();