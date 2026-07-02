const express = require('express');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const { port } = require('./config/env');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware for parsing JSON bodies
app.use(express.json({ limit: '1mb' }));

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

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
