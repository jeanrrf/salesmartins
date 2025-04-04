require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/database');
const app = express();
const PORT = process.env.PORT || 3001;

// Connect to the database
connectDB();

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://192.168.1.4:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Routes
app.use('/api', require('./routes/api'));

// Error handling middleware
app.use(require('./middleware/errorHandler'));

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});