// routes/userRoutes.js
const express = require('express');
const User = require('../models/User');
const router = express.Router();

// Route to register a new user
router.post('/register', async (req, res) => {
  const { name, email } = req.body;

  try {
    const user = new User({ name, email });
    await user.save();
    res.status(201).json({ userId: user._id });
  } catch (error) {
    res.status(500).json({ error: 'Error registering user' });
  }
});

// Route to log in an existing user
router.post('/login', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.status(200).json({ userId: user._id });
  } catch (error) {
    res.status(500).json({ error: 'Error logging in user' });
  }
});

module.exports = router;
