const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Login route
router.post('/login', authController.login);

// Verify token route
router.post('/verify', authController.verifyToken);

module.exports = router;
