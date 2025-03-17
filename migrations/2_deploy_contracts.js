// file: ./migrations/2_deploy_contracts.js
// description: Deploy the TodoList and DBVerification contracts to the blockchain
// module: contracts
// author: Andrew Donelson
// license: MIT
// copyright: 2025, Andrew Donelson

const TodoList = artifacts.require("TodoList");
const DBVerification = artifacts.require("DBVerification");

module.exports = function(deployer) {
  // Deploy TodoList contract
  deployer.deploy(TodoList)
    .then(() => {
      console.log(`TodoList deployed at: ${TodoList.address}`);
      
      // Deploy DBVerification contract after TodoList
      return deployer.deploy(DBVerification);
    })
    .then(() => {
      console.log(`DBVerification deployed at: ${DBVerification.address}`);
    })
    .catch(error => {
      console.error("Error during contract deployment:", error);
    });
};