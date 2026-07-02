const express = require('express');
const { ensureValidAccessToken } = require('../controllers/tokenController');
const { oauth2callback, refreshAccessToken } = require('../controllers/authController');
const { getUserId } = require('../utils/user');

const router = express.Router();

// Home route
router.get('/', (req, res) => {
  res.send('Welcome to Authorization 2.0');
});

// Route to handle OAuth2 callback and exchange authorization code for tokens
router.get('/oauth2callback', oauth2callback);

// Route to get access token (with middleware to ensure it's valid)
router.get('/get-access-token', ensureValidAccessToken, (req, res) => {
  res.json({ access_token: req.access_token });
});

// Route to manually refresh access token
router.get('/refresh-token', async (req, res) => {
  const userId = getUserId(req);

  try {
    const tokenDoc = await refreshAccessToken(userId);
    res.json({ access_token: tokenDoc.access_token });
  } catch (error) {
    console.error('Error refreshing token:', error.message);
    res.status(500).send('Error refreshing token');
  }
});


module.exports = router;
