const express = require('express');
const router = express.Router();
const affiliateController = require('../controllers/affiliateController');
const productsController = require('../controllers/productsController');

// Rotas de produtos
router.get('/products', productsController.getProducts);
router.get('/products/special', productsController.getSpecialProducts);

// Rotas de affiliate
router.get('/affiliate/products', affiliateController.getDatabaseProducts);
router.get('/affiliate/products/special', affiliateController.getSpecialProducts);
router.get('/affiliate/category/:categoryId/products', affiliateController.getProductsByCategory);

module.exports = router;