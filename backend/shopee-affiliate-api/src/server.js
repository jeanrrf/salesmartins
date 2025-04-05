const path = require('path');
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3001;

// Basic middleware
app.use(cors());
app.use(express.json());

// Serve static files
app.use('/images', express.static(path.join(__dirname, '../frontend-react/src/assets/images')));

// Routes
app.use('/api', require('./routes/api'));

// Simple error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});