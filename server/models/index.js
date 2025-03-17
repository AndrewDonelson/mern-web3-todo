// file: server/models/index.js
// description: Exports all MongoDB models for easy importing
// module: Server
// License: MIT
// Author: Andrew Donelson
// Copyright 2025 Andrew Donelson

const User = require('./User');
const Profile = require('./Profile');
const Todo = require('./Todo');

module.exports = {
  User,
  Profile,
  Todo
};