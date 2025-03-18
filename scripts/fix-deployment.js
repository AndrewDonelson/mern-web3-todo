// file: scripts/fix-deployment.js
// description: Script to fix contract deployment issues
// module: Scripts
// License: MIT
// Author: Andrew Donelson
// Copyright 2025 Andrew Donelson

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Starting contract deployment fix...');

// Step 1: Ensure the network ID in truffle-config.js is set to 1337
console.log('Checking truffle configuration...');
const truffleConfigPath = path.join(__dirname, '../truffle-config.js');
let truffleConfig = fs.readFileSync(truffleConfigPath, 'utf8');

// Make sure network_id is set to 1337
if (!truffleConfig.includes('network_id: 1337')) {
  console.log('Updating network_id to 1337 in truffle-config.js');
  truffleConfig = truffleConfig.replace(/network_id: "\*"/, 'network_id: 1337');
  fs.writeFileSync(truffleConfigPath, truffleConfig);
}

// Step 2: Clean build artifacts
console.log('Cleaning build artifacts...');
try {
  const buildDir = path.join(__dirname, '../build');
  if (fs.existsSync(buildDir)) {
    fs.rmSync(buildDir, { recursive: true, force: true });
  }
} catch (err) {
  console.error('Error cleaning build directory:', err);
}

// Step 3: Compile contracts
console.log('Compiling contracts...');
try {
  execSync('npx truffle compile', { stdio: 'inherit' });
} catch (err) {
  console.error('Error compiling contracts:', err);
  process.exit(1);
}

// Step 4: Migrate contracts to the correct network
console.log('Migrating contracts to development network...');
try {
  execSync('npx truffle migrate --reset --network development', { stdio: 'inherit' });
} catch (err) {
  console.error('Error migrating contracts:', err);
  process.exit(1);
}

console.log('Contract deployment fix completed successfully!');
console.log('Please restart your application for changes to take effect.');