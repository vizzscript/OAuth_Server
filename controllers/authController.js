const axios = require('axios');
const querystring = require('querystring');
const Token = require('../models/Token');

// Exchange authorization code for tokens
const exchangeCodeForTokens = async (code, userId) => {
  const requestBody = querystring.stringify({
    code,
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET,
    redirect_uri: process.env.REDIRECT_URI,
    grant_type: 'authorization_code',
  });

  try {
    const response = await axios.post('https://oauth2.googleapis.com/token', requestBody, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const { access_token, refresh_token, expires_in } = response.data;
    const expirationTime = Date.now() + expires_in * 1000;

    await saveTokens(userId, access_token, refresh_token, expirationTime);

    return { access_token, refresh_token, expirationTime };
  } catch (error) {
    console.error('Error exchanging authorization code:', error.response ? error.response.data : error.message);
    throw error;
  }
};

// Save tokens to the database
const saveTokens = async (userId, accessToken, refreshToken, expirationTime) => {
  try {
    await Token.updateOne(
      { userId },
      { accessToken, refreshToken, expirationTime },
      { upsert: true }
    );
  } catch (error) {
    console.error('Error saving tokens:', error.message);
    throw error;
  }
};

// Refresh access token if expired
const refreshAccessToken = async (userId) => {
  try {
    const tokenDoc = await Token.findOne({ userId });

    if (!tokenDoc) throw new Error('Token not found for user');

    const { refresh_token } = tokenDoc;

    const requestBody = querystring.stringify({
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      refresh_token: refresh_token,
      grant_type: 'refresh_token',
    });

    const response = await axios.post('https://oauth2.googleapis.com/token', requestBody, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    const { access_token, expires_in } = response.data;
    const newExpirationTime = Date.now() + expires_in * 1000;

    await saveTokens(userId, access_token, refresh_token, newExpirationTime);

    return access_token;
  } catch (error) {
    console.error('Error refreshing token:', error.response ? error.response.data : error.message);
    throw error;
  }
};

// OAuth2 callback handler
const oauth2callback = async (req, res) => {
  const { code } = req.query;
  const userId = 'user_id'; // Adjust this based on your user management logic

  try {
    const tokens = await exchangeCodeForTokens(code, userId);
    res.redirect('https://drive.google.com'); // Redirect to Google Drive or another page after successful authentication
  } catch (error) {
    console.error('Error exchanging authorization code for tokens:', error.message);
    res.status(500).send('Error exchanging code for tokens');
  }
};

module.exports = { oauth2callback, exchangeCodeForTokens, refreshAccessToken };