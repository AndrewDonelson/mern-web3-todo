// file: ./migrations/2_deploy_contracts
// description: Deploy the TodoList contract to the blockchain
// module: contracts
// author: Andrew Donelson
// license: MIT
// copyright: 2025, Andrew Donelson

const TodoList = artifacts.require("TodoList");

module.exports = function(deployer) {
  deployer.deploy(TodoList);
};