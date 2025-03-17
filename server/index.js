const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Web3 = require('web3');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/web3todo', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.log(err));

// Connect to local blockchain
const web3 = new Web3('http://localhost:8545');

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
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));