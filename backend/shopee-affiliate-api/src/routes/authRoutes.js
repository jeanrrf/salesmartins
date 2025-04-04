const express = require('express');
const { AuthController } = require('../controllers/authController');
const { validateRegister, validateLogin } = require('../middleware/validator');

const router = express.Router();
const authController = new AuthController();

// Register route
router.post('/register', validateRegister, authController.register);

// Login route
router.post('/login', validateLogin, authController.login);

module.exports = router;