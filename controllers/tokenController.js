const Token = require('../models/Token');
const { refreshAccessToken } = require('./authController');
const { getUserId } = require('../utils/user');

// Middleware to ensure a valid access token
const ensureValidAccessToken = async (req, res, next) => {
  const userId = getUserId(req);

  try {
    let tokenDoc = await Token.findOne({ userId });

    if (!tokenDoc) {
      return res.status(401).send('No token found for user');
    }

    // Check if the token is expired
    if (Date.now() >= tokenDoc.expirationTime) {
      tokenDoc = await refreshAccessToken(userId);
    }

    req.access_token = tokenDoc.access_token;
    next();
  } catch (error) {
    console.error('Error in token validation middleware:', error.message);
    res.status(500).send('Internal Server Error');
  }
};

module.exports = { ensureValidAccessToken };
