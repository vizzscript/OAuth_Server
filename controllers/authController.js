const axios = require('axios');
const Token = require('../models/Token');
const { googleOAuth } = require('../config/env');
const { getUserId } = require('../utils/user');

const tokenRequestConfig = {
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  timeout: 10000,
};

const buildTokenRequestBody = (params) => new URLSearchParams(params).toString();

const logTokenDetails = (label, userId, tokenData) => {
  console.log(`[${label}] userId: ${userId}`);
  console.log(`[${label}] access_token: ${tokenData.access_token}`);

  if (tokenData.refresh_token) {
    console.log(`[${label}] refresh_token: ${tokenData.refresh_token}`);
  }

  console.log(`[${label}] expires_at: ${new Date(tokenData.expirationTime).toISOString()}`);
};

// Exchange authorization code for tokens
const exchangeCodeForTokens = async (code, userId) => {
  const requestBody = buildTokenRequestBody({
    code,
    client_id: googleOAuth.clientId,
    client_secret: googleOAuth.clientSecret,
    redirect_uri: googleOAuth.redirectUri,
    grant_type: 'authorization_code',
  });

  try {
    const response = await axios.post(googleOAuth.tokenUrl, requestBody, tokenRequestConfig);

    const { access_token, refresh_token, expires_in } = response.data;
    const expirationTime = Date.now() + expires_in * 1000;

    await saveTokens(userId, access_token, refresh_token, expirationTime);
    logTokenDetails('OAuth Token Exchange', userId, { access_token, refresh_token, expirationTime });

    return { access_token, refresh_token, expirationTime };
  } catch (error) {
    console.error('Error exchanging authorization code:', error.response ? error.response.data : error.message);
    throw error;
  }
};

// Save tokens to the database
const saveTokens = async (userId, access_token, refresh_token, expirationTime) => {
  try {
    return await Token.findOneAndUpdate(
      { userId },
      { access_token, refresh_token, expirationTime },
      { new: true, upsert: true, runValidators: true }
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
    const requestBody = buildTokenRequestBody({
      client_id: googleOAuth.clientId,
      client_secret: googleOAuth.clientSecret,
      refresh_token,
      grant_type: 'refresh_token',
    });

    const response = await axios.post(googleOAuth.tokenUrl, requestBody, tokenRequestConfig);

    const { access_token, expires_in } = response.data;
    const newExpirationTime = Date.now() + expires_in * 1000;

    const updatedToken = await saveTokens(userId, access_token, refresh_token, newExpirationTime);
    logTokenDetails('OAuth Token Refresh', userId, {
      access_token: updatedToken.access_token,
      refresh_token: updatedToken.refresh_token,
      expirationTime: updatedToken.expirationTime,
    });

    return updatedToken;
  } catch (error) {
    console.error('Error refreshing token:', error.response ? error.response.data : error.message);
    throw new Error('Could not refresh access token');
  }
};

// OAuth2 callback handler
const oauth2callback = async (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.status(400).send('Missing authorization code');
  }

  const userId = getUserId(req);

  try {
    await exchangeCodeForTokens(code, userId);
    res.redirect(googleOAuth.successRedirectUrl);
  } catch (error) {
    console.error('Error exchanging authorization code for tokens:', error.message);
    res.status(500).send('Error exchanging code for tokens');
  }
};

module.exports = { oauth2callback, exchangeCodeForTokens, refreshAccessToken };
