<img src="https://raw.githubusercontent.com/AndrewDonelson/mern-web3-todo/main/client/public/logo.svg" alt="MERN Web3 Todo" width="256" height="256" /><br />
# MERN Web3 Todo

A decentralized todo application built with MERN stack (MongoDB, Express, React, Node.js) and blockchain technologies. Securely manage your tasks while leveraging the power of distributed technologies.

## Why I Created This Project

This project was primarily developed as a practical exercise to strengthen my MERN stack skills for job interviews and professional development. While my preferred technology stack typically involves Convex and Next.js, I recognized the importance of maintaining proficiency with the MERN stack given its widespread adoption in the industry.

### 💼 Skill Development for Job Interviews

My main goal was to create a comprehensive project that demonstrates competency across the entire MERN stack while incorporating cutting-edge Web3 technologies:

- **MongoDB**: Implement proper database schema design and efficient queries
- **Express.js**: Develop a well-structured REST API with proper middleware patterns
- **React**: Showcase modern React practices including hooks, context, and TypeScript
- **Node.js**: Demonstrate server-side JavaScript with proper architecture

By building a complete application rather than isolated components, I created a portfolio piece that showcases end-to-end development capabilities.

### 🔄 Bridging Traditional and Emerging Technologies

The project combines traditional web development with blockchain technologies, demonstrating adaptability with emerging tech paradigms:

- **Web3 Integration**: Practical implementation of blockchain communication
- **Smart Contract Development**: Real-world Solidity development experience
- **Modern Authentication**: Implementation of cryptographic wallet-based authentication

### 🛠️ Technical Skill Refresh and Enhancement

This project served as a comprehensive refresh of several key technical areas:

- **TypeScript**: Enhanced type safety throughout the application
- **TailwindCSS & ShadCN**: Modern UI development patterns
- **API Development**: Best practices for RESTful endpoints and error handling
- **State Management**: Implementation of context-based and atomic state patterns

### 📚 Creating a Reference Implementation

Beyond personal skill development, this project also serves as my own reference implementation for MERN stack patterns that I can quickly revisit before interviews or when starting new projects.

## Features

- **Web3 Authentication**: Connect with MetaMask or other Ethereum wallets
- **Blockchain-Powered Tasks**: All task operations are recorded on the blockchain
- **Smart Contract Integration**: Secure task ownership and completion verification
- **User Dashboard**: View statistics and activity on personalized dashboard
- **Advanced Task Management**: Categories, priorities, and deadlines
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Dark/Light Mode**: Choose your preferred theme
- **Optimized Performance**: Fast loading and responsive interactions

## MongoDB/Blockchain Hybrid Storage System

This project features a unique hybrid storage architecture that combines the speed and flexibility of MongoDB with the security and immutability of blockchain.

### How It Works

#### Architecture Overview

The hybrid storage system consists of:

1. **MongoDB Layer**: Primary database for storing complete document data
2. **Blockchain Layer**: Immutable verification layer to store document hashes
3. **Connector Layer**: Services that bridge MongoDB and blockchain operations

#### Data Flow and Verification

1. **Document Creation**:
   - Data is first saved to MongoDB
   - A secure hash of the document is generated
   - The hash is stored on the blockchain via a smart contract

2. **Document Retrieval**:
   - Data is retrieved from MongoDB for performance
   - Optionally, integrity verification is performed by comparing the current document hash against the stored blockchain hash

3. **Document Updates**:
   - MongoDB document is updated
   - A new hash is generated and stored on the blockchain
   - History of changes is maintained for auditability

4. **Batch Operations**:
   - Multiple documents can be verified in a single blockchain transaction
   - Reduces gas costs while maintaining security

#### Smart Contract Integration

The system uses a custom `DBVerification` smart contract that provides:

- Hash storage and retrieval functions
- Verification and integrity checking
- Operation permissioning and access control
- Document archiving functionality

#### Health Monitoring and Recovery

- Real-time health checks for both MongoDB and blockchain connections
- Automatic recovery mechanisms for connection failures
- Rate limiting and throttling for blockchain operations
- Detailed diagnostics and system status APIs

### Advantages

- **Security with Performance**: MongoDB's query performance with blockchain's immutability
- **Tamper Protection**: Data modifications can be detected by comparing hashes
- **Cost Efficiency**: Minimize blockchain storage costs by only storing verification hashes
- **Scalability**: MongoDB handles large datasets while blockchain ensures integrity
- **Flexibility**: Choose which data requires blockchain verification
- **Transparent Verification**: Easily audit data integrity at any time
- **Graceful Degradation**: System remains operational even if blockchain is temporarily unavailable

### Limitations

- **Write Latency**: Blockchain verification adds some latency to write operations
- **Gas Costs**: Each verification transaction requires blockchain gas fees
- **Complexity**: Added system complexity compared to traditional storage
- **Synchronization**: Requires careful handling to maintain consistency between systems
- **Partial Protection**: Only protects against content tampering, not unauthorized access

### Configuration Options

The hybrid system offers multiple configuration options:

- **Verification Modes**: Immediate, batched, or manual verification
- **Recovery Settings**: Automated or manual recovery procedures
- **Throttling Controls**: Rate limits for blockchain operations
- **Integrity Checking**: On-demand or scheduled verification

## Tech Stack

### Frontend
- React.js with TypeScript
- TailwindCSS & ShadCN UI
- React Router for navigation
- Zustand for state management
- Web3.js for blockchain integration

### Backend
- Node.js & Express
- MongoDB for data storage
- JWT for session management
- Web3.js for blockchain interaction

### Blockchain
- Solidity smart contracts
- Truffle development framework
- Ganache for local blockchain testing

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- MetaMask browser extension
- Ganache for local blockchain (for development)

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/AndrewDonelson/mern-web3-todo.git
   cd mern-web3-todo
   ```

2. Run the setup script to configure environment
   ```bash
   npm run setup
   ```

3. Start the development environment
   ```bash
   npm run dev
   ```

4. Access the application
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Backend API: [http://localhost:5000](http://localhost:5000)

## Project Structure

The project follows a modular architecture:
```
mern-web3-todo/
├── client/          # React frontend application
├── server/          # Express backend API
├── contracts/       # Solidity smart contracts
├── migrations/      # Truffle migrations
└── ...              # Configuration files
```

See the [development plan](development-plan.md) for a more detailed breakdown of the project structure.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

Andrew Donelson - [@AndrewDonelson](https://x.com/AndrewDonelson)

Project Link: [https://github.com/AndrewDonelson/mern-web3-todo](https://github.com/AndrewDonelson/mern-web3-todo)

## Acknowledgments

- [Truffle Suite](https://trufflesuite.com/)
- [MetaMask](https://metamask.io/)
- [ShadCN UI](https://ui.shadcn.com/)
- [MongoDB](https://www.mongodb.com/)