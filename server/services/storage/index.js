// file: server/services/storage/index.js
// description: Exports all storage services for easy importing
// module: Server
// License: MIT
// Author: Andrew Donelson
// Copyright 2025 Andrew Donelson

const AccountStorage = require('./AccountStorage');
const TodoStorage = require('./TodoStorage');
const BaseStorage = require('./BaseStorage');

// Legacy exports for backward compatibility (deprecated)
const UserStorage = AccountStorage;
const ProfileStorage = AccountStorage;

module.exports = {
  AccountStorage,  // New unified account storage
  TodoStorage,
  BaseStorage,
  
  // Legacy exports (deprecated)
  UserStorage,
  ProfileStorage
};