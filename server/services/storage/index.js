// file: server/services/storage/index.js
// description: Exports all storage services for easy importing
// module: Server
// License: MIT
// Author: Andrew Donelson
// Copyright 2025 Andrew Donelson

const UserStorage = require('./UserStorage');
const ProfileStorage = require('./ProfileStorage');
const TodoStorage = require('./TodoStorage');
const BaseStorage = require('./BaseStorage');

module.exports = {
  UserStorage,
  ProfileStorage,
  TodoStorage,
  BaseStorage
};