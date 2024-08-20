const Token = require('../models/Token');
const { refreshAccessToken } = require('./authController');

// Middleware to ensure a valid access token
const ensureValidAccessToken = async (req, res, next) => {
  const userId = 'user_id'; // Adjust this based on your user management logic

  try {
    let tokenDoc = await Token.findOne({ userId });

    if (!tokenDoc) {
      return res.status(401).send('No token found for user');
    }

    // Check if the token is expired
    if (Date.now() >= tokenDoc.expirationTime) {
      // Token expired, refresh it
      const newAccessToken = await refreshAccessToken(userId);
      tokenDoc = await Token.findOne({ userId }); // Fetch the updated token
    }

    req.access_token = tokenDoc.accessToken;
    next();
  } catch (error) {
    console.error('Error in token validation middleware:', error.message);
    res.status(500).send('Internal Server Error');
  }
};

module.exports = { ensureValidAccessToken };
