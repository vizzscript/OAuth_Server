const Token = require('../models/Token');


// Middleware to ensure valid access token
const ensureValidAccessToken = async (req, res, next) => {
  const userId = 'user_id'; // Adjust this based on your user management logic
  try {
    const tokenDoc = await Token.findOne({ userId });
    if (tokenDoc && tokenDoc.expirationTime > Date.now()) {
      req.access_token = tokenDoc.accessToken;
      next();
    } else {
      res.status(401).send('Access token is invalid or expired');
    }
  } catch (error) {
    console.error('Error in token validation middleware:', error.message);
    res.status(500).send('Internal Server Error');
  }
};

module.exports = { ensureValidAccessToken };
