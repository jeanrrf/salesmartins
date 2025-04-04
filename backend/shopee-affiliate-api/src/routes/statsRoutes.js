const express = require('express');
const { StatsController } = require('../controllers/statsController');
const router = express.Router();

const statsController = new StatsController();

// Route to get overall affiliate statistics
router.get('/overall', statsController.getStats);

// Route to get user-specific affiliate statistics
router.get('/user/:userId', statsController.getUserStats);

module.exports = router;