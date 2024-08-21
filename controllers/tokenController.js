const Token = require('../models/Token');
const { refreshAccessToken } = require('./authController');

const getUserId = (req) => {
  // Example logic: Extract userId from request, session, or token
  return req.user ? req.user.id : 'default_user_id';
};

// Middleware to ensure a valid access token
const ensureValidAccessToken = async (req, res, next) => {
  const userId = getUserId(req);


  try {
    let tokenDoc = await Token.findOne({ userId });

    if (!tokenDoc) {
      console.error(`No token found for user: ${userId}`);
      return res.status(401).send('No token found for user');
    }

    // Check if the token is expired
    if (Date.now() >= tokenDoc.expirationTime) {
      // Token expired, refresh it
      const newAccessToken = await refreshAccessToken(userId);
      tokenDoc = await Token.findOne({ userId }); // Fetch the updated token
    }

    req.access_token = tokenDoc.access_token;
    next();
  } catch (error) {
    console.error('Error in token validation middleware:', error.message);
    res.status(500).send('Internal Server Error');
  }
};

module.exports = { ensureValidAccessToken };
