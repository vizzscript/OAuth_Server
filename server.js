const express = require('express');
const bodyParser = require('body-parser');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// Middleware to parse URL-encoded data
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/auth', authRoutes);

// Default route
app.get('/', (req, res) => {
  res.send('Welcome to the OAuth 2.0 Authorization Server');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
//End