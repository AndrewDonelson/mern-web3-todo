// file: ./setup.mjs
// description: Setup script for MERN Web3 Todo App
// module: project
// author: Andrew Donelson
// license: MIT
// copyright: 2025, Andrew Donelson
import fs from "fs";
import { config as loadEnvFile } from "dotenv";
import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import { createInterface } from 'readline';

const GIT_CONFIG_COMMANDS = [
    'git config core.autocrlf false',
    'git config core.eol lf'
];

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEBUG = false;

function debugLog(message, data = null) {
    if (DEBUG) {
        console.log('\n[DEBUG] ' + message);
        if (data) {
            console.log(JSON.stringify(data, null, 2));
        }
    }
}

function execCommand(command, silent = false) {
    try {
        return execSync(command, {
            stdio: silent ? 'ignore' : 'inherit',
            shell: true,
            env: { ...process.env, FORCE_COLOR: true }
        });
    } catch (error) {
        debugLog(`Error executing command: ${command}`, error);
        throw error;
    }
}

function isGitRepo() {
    try {
        execCommand('git rev-parse --is-inside-work-tree', true);
        return true;
    } catch {
        return false;
    }
}

function initGitAndCommit() {
    try {
        if (!isGitRepo()) {
            console.log("Initializing Git repository...");
            execCommand('git init');
            GIT_CONFIG_COMMANDS.forEach(cmd => execCommand(cmd));
        }

        const gitattributesPath = path.join(process.cwd(), '.gitattributes');
        if (!fs.existsSync(gitattributesPath)) {
            const gitattributes = `
* text=auto eol=lf
*.{cmd,[cC][mM][dD]} text eol=crlf
*.{bat,[bB][aA][tT]} text eol=crlf
            `.trim();
            fs.writeFileSync(gitattributesPath, gitattributes);
            execCommand('git add .gitattributes');
        }

        const gitignorePath = path.join(process.cwd(), '.gitignore');
        if (!fs.existsSync(gitignorePath)) {
            createGitIgnore();
        }
    } catch (error) {
        console.error("Failed to initialize Git:", error);
        throw error;
    }
}

function createGitIgnore() {
    const gitignoreContent = `
# Node.js dependencies
node_modules/
npm-debug.log
yarn-debug.log
yarn-error.log
.pnp/
.pnp.js

# Truffle/Ethereum
/build/
/build_webpack/
.env
.secret
.infura-key

# MongoDB
/data/db

# Logs
logs
*.log

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Directory for instrumented libs generated by jscoverage/JSCover
lib-cov

# Coverage directory used by tools like istanbul
coverage

# Distribution directories
dist/
out/
build/

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Optional REPL history
.node_repl_history

# dotenv environment variable files
.env*
!.env.example

# Mac OS
.DS_Store

# Windows
Thumbs.db
ehthumbs.db
Desktop.ini

# Linux
*~

# IDE files
.idea/
.vscode/
*.sublime-project
*.sublime-workspace

# Local development
.env.local
.env.development.local
.env.test.local
.env.production.local

# Ganache
ganache-blockchain-data/
`;

    fs.writeFileSync(path.join(process.cwd(), '.gitignore'), gitignoreContent);
    console.log("Created .gitignore file");
}

function createRL() {
    return createInterface({
        input: process.stdin,
        output: process.stdout
    });
}

async function question(rl, query) {
    return new Promise(resolve => rl.question(query, resolve));
}

async function loadEnvVars() {
    const envPath = path.join(process.cwd(), ".env");
    if (!fs.existsSync(envPath)) return {};

    const config = {};
    loadEnvFile({ path: envPath, processEnv: config });
    return config;
}

async function createProjectStructure() {
    console.log("\n=== Creating Project Structure ===");

    // Create client folder if it doesn't exist
    const clientDir = path.join(process.cwd(), 'client');
    if (!fs.existsSync(clientDir)) {
        console.log("Creating client directory...");
        fs.mkdirSync(clientDir, { recursive: true });

        // Initialize React app
        console.log("Initializing React app...");
        execCommand('npx create-react-app client --template typescript');
    }

    // Create server folder if it doesn't exist
    const serverDir = path.join(process.cwd(), 'server');
    if (!fs.existsSync(serverDir)) {
        console.log("Creating server directory...");
        fs.mkdirSync(serverDir, { recursive: true });

        // Create basic server files
        const serverPackageJson = {
            "name": "mern-web3-todo-server",
            "version": "1.0.0",
            "description": "Backend for MERN Web3 Todo App",
            "main": "index.js",
            "scripts": {
                "start": "node index.js",
                "dev": "nodemon index.js",
                "test": "echo \"Error: no test specified\" && exit 1"
            },
            "dependencies": {
                "cors": "^2.8.5",
                "dotenv": "^16.4.5",
                "express": "^4.18.2",
                "mongoose": "^8.2.0",
                "web3": "^1.10.2"
            },
            "devDependencies": {
                "nodemon": "^3.0.1"
            }
        };

        fs.writeFileSync(
            path.join(serverDir, 'package.json'),
            JSON.stringify(serverPackageJson, null, 2)
        );

        // Create basic server index.js
        const serverIndexJs = `
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Web3 = require('web3');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/web3todo', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.log(err));

// Connect to local blockchain
const web3 = new Web3(process.env.BLOCKCHAIN_URI || 'http://localhost:7545');

// Load the compiled contract JSON
const TodoList = require('../build/contracts/TodoList.json');

// User model
const User = mongoose.model('User', {
  address: String,
  name: String
});

// Routes
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/users', async (req, res) => {
  const user = new User({
    address: req.body.address,
    name: req.body.name
  });

  try {
    const newUser = await user.save();
    res.status(201).json(newUser);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(\`Server running on port \${PORT}\`));
`;

        fs.writeFileSync(path.join(serverDir, 'index.js'), serverIndexJs);
    }

    // Create contracts folder if it doesn't exist
    const contractsDir = path.join(process.cwd(), 'contracts');
    if (!fs.existsSync(contractsDir)) {
        console.log("Creating contracts directory...");
        fs.mkdirSync(contractsDir, { recursive: true });

        // Create TodoList.sol contract
        const todoListContract = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract TodoList {
    uint public taskCount = 0;
    
    struct Task {
        uint id;
        string content;
        bool completed;
        address owner;
    }
    
    mapping(uint => Task) public tasks;
    
    event TaskCreated(
        uint id,
        string content,
        bool completed,
        address owner
    );
    
    event TaskCompleted(
        uint id,
        bool completed
    );
    
    function createTask(string memory _content) public {
        taskCount++;
        tasks[taskCount] = Task(taskCount, _content, false, msg.sender);
        emit TaskCreated(taskCount, _content, false, msg.sender);
    }
    
    function toggleCompleted(uint _id) public {
        Task memory _task = tasks[_id];
        require(_task.owner == msg.sender, "Only the owner can modify this task");
        _task.completed = !_task.completed;
        tasks[_id] = _task;
        emit TaskCompleted(_id, _task.completed);
    }
}`;

        fs.writeFileSync(path.join(contractsDir, 'TodoList.sol'), todoListContract);
    }

    // Create migrations folder if it doesn't exist
    const migrationsDir = path.join(process.cwd(), 'migrations');
    if (!fs.existsSync(migrationsDir)) {
        console.log("Creating migrations directory...");
        fs.mkdirSync(migrationsDir, { recursive: true });

        // Create migration file
        const migrationJs = `const TodoList = artifacts.require("TodoList");

module.exports = function(deployer) {
  deployer.deploy(TodoList);
};`;

        fs.writeFileSync(path.join(migrationsDir, '2_deploy_contracts.js'), migrationJs);
    }
}

async function collectSettings(rl) {
    const currentVars = await loadEnvVars();
    const settings = {};

    console.log("\n=== Project Settings ===");

    const prompts = {
        MONGODB_URI: "MongoDB connection URI (leave empty for localhost)",
        BLOCKCHAIN_URI: "Blockchain connection URI (leave empty for localhost)",
        PORT: "Server port"
    };

    for (const [key, prompt] of Object.entries(prompts)) {
        const defaultValue = currentVars[key] || (key === 'MONGODB_URI' ? 'mongodb://localhost:27017/web3todo' :
            key === 'BLOCKCHAIN_URI' ? 'http://localhost:7545' :
                key === 'PORT' ? '5000' : '');
        const defaultDisplay = defaultValue ? ` (${defaultValue})` : '';
        const response = await question(rl, `${prompt}${defaultDisplay}: `);
        settings[key] = response || defaultValue;
    }

    return settings;
}

async function updateEnvFile(settings) {
    const envPath = path.join(process.cwd(), ".env");
    const currentVars = await loadEnvVars();

    const combinedSettings = {
        ...currentVars,
        ...settings
    };

    let envContent = '# MERN Web3 Todo App Environment Variables\n\n';
    for (const [key, value] of Object.entries(combinedSettings)) {
        envContent += `${key}=${value}\n`;
    }

    await fs.promises.writeFile(envPath, envContent);
}

async function setupEnvironmentVariables() {
    const rl = createRL();

    try {
        const settings = await collectSettings(rl);
        await updateEnvFile(settings);

        console.log("\nEnvironment variables have been successfully updated!");
    } catch (error) {
        console.error("Error setting up environment variables:", error);
        throw error;
    } finally {
        rl.close();
    }
}

async function runSetup() {
    try {
        console.log("Starting setup for MERN Web3 Todo App...");

        // Initialize Git repository
        initGitAndCommit();

        // Create project structure
        await createProjectStructure();

        // Setup environment variables
        await setupEnvironmentVariables();

        console.log("\nInstalling dependencies...");
        execCommand('npm run install:all');

        console.log("\nCompiling smart contracts...");
        execCommand('npx truffle compile');

        console.log("\nSetup completed successfully!");
        console.log("\nTo start your development environment:");
        console.log("1. Start MongoDB (if not already running)");
        console.log("2. Run 'npm run dev' to start all services");
        console.log("3. Access the frontend at http://localhost:3000");
        console.log("4. Access the backend at http://localhost:5000");

        const status = execSync('git status --porcelain').toString();
        if (status) {
            console.log("\nCommitting changes...");
            execCommand('git add .');
            execCommand('git commit -m "feat: initial project setup\n\n- Set up MERN stack\n- Configure Web3 integration\n- Create smart contracts\n- Set up development environment"');
        }

    } catch (error) {
        debugLog("Setup failed", error);
        console.error('Setup failed:', error);
        process.exit(1);
    }
}

console.log("Starting setup script...");
runSetup().catch(error => {
    debugLog("Unhandled error", error);
    console.error('Setup failed:', error);
    process.exit(1);
});