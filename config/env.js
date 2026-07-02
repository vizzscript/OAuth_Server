require('dotenv').config();

const requiredEnvVars = ['MONGO_URI', 'CLIENT_ID', 'CLIENT_SECRET', 'REDIRECT_URI'];

const isPlaceholderValue = (value) => /<[^>]+>/.test(value);

const missingEnvVars = requiredEnvVars.filter((key) => {
  const value = process.env[key];
  return !value || isPlaceholderValue(value);
});

if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

module.exports = {
  port: process.env.PORT || 3000,
  mongoUri: process.env.MONGO_URI,
  googleOAuth: {
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    redirectUri: process.env.REDIRECT_URI,
    tokenUrl: process.env.GOOGLE_TOKEN_URL || 'https://oauth2.googleapis.com/token',
    successRedirectUrl: process.env.SUCCESS_REDIRECT_URL || 'https://drive.google.com',
  },
};
