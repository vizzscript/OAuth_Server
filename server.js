const express = require('express');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const { authenticateToken } = require('./middleware/authMiddleware');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// Middleware for parsing JSON bodies
app.use(express.json());

// Home route
app.get('/', (req, res) => {
  res.send('Welcome to Authorization 2.0');
});

// Routes
app.use('/auth', authenticateToken, authRoutes);
app.use('/users', userRoutes);

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
