const path = require('path');
require('dotenv').config({
  path: path.resolve(__dirname, '../.env')
});
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/database');
const app = express();
const PORT = process.env.PORT || 3001;

// Connect to the database
connectDB();

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'https://salesmartins-wheat.vercel.app', 'https://salesmartins.vercel.app'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Serve static files
app.use('/images', express.static(path.join(__dirname, '../frontend-react/src/assets/images')));

// Routes
app.use('/api', require('./routes/api'));

// Error handling middleware
app.use(require('./middleware/errorHandler'));

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});