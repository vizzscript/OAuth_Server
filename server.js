const express = require('express');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');

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

// Policy route
app.get('/policy', (req, res) => {
  res.send(`
    <html>
      <body>
        <p>You can view our policy <a href="https://app.websitepolicies.com/policies/view/rctwx9nf" target="_blank">here</a>.</p>
      </body>
    </html>
  `);
});

// Routes
app.use('/auth', authRoutes);



// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
