const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const querystring = require('querystring');
const app = express();
const PORT = process.env.PORT || 3000;
require('dotenv').config();

// In-memory store for tokens (replace with a proper database in production)
const tokensStore = {};

// Middleware to parse URL-encoded data
app.use(bodyParser.urlencoded({ extended: true }));

// Configuration values
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI; // Use the correct deployed server URL

// Default route to handle root URL
app.get('/', (req, res) => {
  res.send('Welcome to the OAuth 2.0 Authorization Server');
});

// Function to exchange authorization code for tokens
async function exchangeCodeForTokens(code) {
  const requestBody = querystring.stringify({
    code: code,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    redirect_uri: REDIRECT_URI,
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

    // Calculate the expiration time based on the expires_in value
    const expirationTime = Date.now() + expires_in * 1000;

    return { access_token, refresh_token, expirationTime };
  } catch (error) {
    // Enhanced error logging
    const errorMessage = error.response
      ? `Error exchanging authorization code: ${error.response.status} - ${error.response.statusText}: ${JSON.stringify(error.response.data)}`
      : `Error exchanging authorization code: ${error.message}`;

    console.error(errorMessage); // Log the error for debugging
    throw new Error(errorMessage);
  }
}

// Function to refresh the access token
async function refreshAccessToken(refreshToken) {
  const requestBody = querystring.stringify({
    refresh_token: refreshToken,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    grant_type: 'refresh_token',
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

    const { access_token, expires_in } = response.data;

    // Update expiration time
    const expirationTime = Date.now() + expires_in * 1000;

    return { access_token, expirationTime };
  } catch (error) {
    // Enhanced error logging
    const errorMessage = error.response
      ? `Error refreshing access token: ${error.response.status} - ${error.response.statusText}: ${JSON.stringify(error.response.data)}`
      : `Error refreshing access token: ${error.message}`;

    console.error(errorMessage); // Log the error for debugging
    throw new Error(errorMessage);
  }
}

// Function to make an API request to Google Drive to list files
async function listDriveFiles(accessToken) {
  try {
    const response = await axios.get('https://www.googleapis.com/drive/v3/files', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    return response.data;
  } catch (error) {
    // Enhanced error logging
    const errorMessage = error.response
      ? `Error listing Google Drive files: ${error.response.status} - ${error.response.statusText}: ${JSON.stringify(error.response.data)}`
      : `Error listing Google Drive files: ${error.message}`;

    console.error(errorMessage); // Log the error for debugging
    throw new Error(errorMessage);
  }
}

// Middleware to check and refresh the access token if needed
async function ensureValidAccessToken(req, res, next) {
  const userTokens = tokensStore['user_id'];

  if (!userTokens) {
    return res.status(404).send('Tokens not found');
  }

  const { access_token, refresh_token, expirationTime } = userTokens;

  // Check if the access token has expired
  if (Date.now() >= expirationTime - 60000) { // 1 minute buffer before actual expiration
    try {
      const { access_token: newAccessToken, expirationTime: newExpirationTime } = await refreshAccessToken(refresh_token);
      // Update the token store with the new access token and expiration time
      tokensStore['user_id'] = { ...userTokens, access_token: newAccessToken, expirationTime: newExpirationTime };
      access_token = newAccessToken;
    } catch (error) {
      return res.status(500).send('Failed to refresh access token');
    }
  }

  // Proceed to the next middleware or route
  next();
}

// Endpoint to handle the redirect and capture the authorization code
app.get('/oauth2callback', async (req, res) => {
  const authorizationCode = req.query.code;

  if (!authorizationCode) {
    return res.status(400).send('Authorization code is missing');
  }

  try {
    const { access_token, refresh_token, expirationTime } = await exchangeCodeForTokens(authorizationCode);

    // Save the tokens (for demo purposes, using an in-memory store)
    tokensStore['user_id'] = { access_token, refresh_token, expirationTime };

    // Log tokens for debugging
    console.log('Tokens stored:', tokensStore['user_id']);

    // Test the connection by listing files in Google Drive
    const driveFiles = await listDriveFiles(access_token);

    // Log the files retrieved for debugging
    console.log('Files in Google Drive:', driveFiles);

    // Redirect the user to their Google Drive
    res.redirect('https://drive.google.com/drive/my-drive?ths=true');
  } catch (error) {
    console.error('Error exchanging authorization code or fetching files:', error.message);
    res.status(500).send('Internal Server Error');
  }
});

// Endpoint to get access token (for Zoho CRM)
app.get('/get-access-token', ensureValidAccessToken, (req, res) => {
  const userTokens = tokensStore['user_id'];
  if (userTokens && userTokens.access_token) {
    res.json({ access_token: userTokens.access_token });
  } else {
    res.status(404).send('Access token not found');
  }
});

// Endpoint to get tokens (for demo purposes)
app.get('/tokens', (req, res) => {
  res.json(tokensStore);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
