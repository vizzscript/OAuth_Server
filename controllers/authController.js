const axios = require('axios');
const querystring = require('querystring');
const Token = require('../models/Token');

// OAuth2 callback function
const oauth2callback = async (req, res) => {
  console.log('Received OAuth2 callback request'); // Add logging
  const { code } = req.query;
  const userId = 'user_id'; // Adjust this based on your user management logic

  try {
    const tokens = await exchangeCodeForTokens(code, userId);
    res.redirect('https://drive.google.com'); // Redirect to Google Drive or another page after successful authentication
  } catch (error) {
    console.error('Error exchanging authorization code for tokens:', error.message); // Log error
    res.status(500).send('Error exchanging code for tokens');
  }
};

const exchangeCodeForTokens = async (code, userId) => {
  const requestBody = querystring.stringify({
    code,
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET,
    redirect_uri: process.env.REDIRECT_URI,
    grant_type: 'authorization_code',
  });

  try {
    const response = await axios.post(
      'https://oauth2.googleapis.com/token',
      requestBody,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const { access_token, refresh_token, expires_in } = response.data;
    const expirationTime = Date.now() + expires_in * 1000;

    console.log('Exchange Code Response:', {
      access_token,
      refresh_token,
      expires_in,
      expirationTime
    });

    await saveTokens(userId, access_token, refresh_token, expirationTime);

    return { access_token, refresh_token, expirationTime };
  } catch (error) {
    console.error('Error exchanging authorization code:', error.response ? error.response.data : error.message);
    throw error;
  }
};

// Refresh Access Token
const refreshAccessToken = async (userId) => {
  try {
    const tokenDoc = await Token.findOne({ userId });
    
    if (!tokenDoc) {
      throw new Error('No tokens found for user');
    }

    const { refresh_token } = tokenDoc;

    const requestBody = querystring.stringify({
      refresh_token,
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      grant_type: 'refresh_token',
    });

    const response = await axios.post(
      'https://oauth2.googleapis.com/token',
      requestBody,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const { access_token, expires_in } = response.data;
    const expirationTime = Date.now() + expires_in * 1000;

    await Token.updateOne(
      { userId },
      {
        access_token,
        expirationTime,
      }
    );

    return { access_token, expirationTime };
  } catch (error) {
    console.error('Error refreshing access token:', error.message);
    throw error;
  }
};


// Save tokens to the database
const saveTokens = async (userId, accessToken, refreshToken, expirationTime) => {
  try {
    console.log('Saving Tokens:', {
      userId,
      accessToken,
      refreshToken,
      expirationTime
    });

    const result = await Token.updateOne(
      { userId },
      {
        access_token: accessToken,
        refresh_token: refreshToken,
        expirationTime,
      },
      { upsert: true }
    );

    console.log('Save Tokens Result:', result);
  } catch (error) {
    console.error('Error saving tokens:', error.message);
    throw error;
  }
};


// Export functions
module.exports = { oauth2callback, exchangeCodeForTokens, refreshAccessToken, saveTokens };
