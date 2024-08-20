const express = require('express');
const { ensureValidAccessToken } = require('../controllers/tokenController');
const { exchangeCodeForTokens, refreshAccessToken } = require('../controllers/authController');

const router = express.Router();

// Route to handle OAuth2 callback and exchange authorization code for tokens
router.get('/oauth2callback', async (req, res) => {
  const { code } = req.query;
  const userId = 'user_id'; // Adjust this based on your user management logic

  try {
    const tokens = await exchangeCodeForTokens(code, userId);
    res.redirect('https://drive.google.com'); // Redirect to Google Drive or another page after successful authentication
  } catch (error) {
    console.error('Error exchanging authorization code for tokens:', error.message);
    res.status(500).send('Error exchanging code for tokens');
  }
});

// Route to get access token (with middleware to ensure it's valid)
router.get('/get-access-token', ensureValidAccessToken, (req, res) => {
  res.json({ access_token: req.access_token });
});

// Route to refresh access token manually
router.get('/refresh-token', async (req, res) => {
  const userId = 'user_id'; // Adjust this based on your user management logic

  try {
    const newTokens = await refreshAccessToken(userId);
    res.json(newTokens);
  } catch (error) {
    res.status(500).send('Error refreshing token');
  }
});

module.exports = router;
