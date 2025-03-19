// file: ./truffle-config.js
// description: Truffle configuration file updated to use compatible Solidity compiler version
// module: Blockchain
// author: Andrew Donelson
// license: MIT
// copyright: 2025, Andrew Donelson

module.exports = {
  networks: {

    development: {
      host: "localhost",
      port: 7545,
      network_id: 1337,
      from: "0x2644c2E180A602CE3bEF09fB959EAd7188776BFb", // First generated account
      gas: 6721975,
      gasPrice: 20000000000
    },

    mocha: {
      timeout: 100000
    },

    compilers: {
      solc: {
        version: "0.7.6",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      }
    }
  }
}