const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');

// Define fallback handler for undefined controller methods
const notImplemented = (req, res) => {
    res.status(501).json({ error: "Este endpoint ainda não está implementado" });
};

// Rotas de busca
router.get('/', searchController.searchProducts || notImplemented);
router.get('/trending', searchController.getTrendingProducts || notImplemented);
router.get('/recommended', searchController.getRecommendedProducts || notImplemented);

module.exports = router;
