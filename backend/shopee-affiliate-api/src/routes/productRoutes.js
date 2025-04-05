const express = require('express');
const router = express.Router();
const productController = require('../controllers/productsController');

// Define fallback handler for undefined controller methods
const notImplemented = (req, res) => {
    res.status(501).json({ error: "Este endpoint ainda não está implementado" });
};

// Rotas organizadas por funcionalidade específica
// Produtos regulares
router.get('/', productController.getProducts || notImplemented); // Rota base para produtos

// Produtos com categorização
router.get('/categories', productController.getCategories || notImplemented);
router.get('/category/:categoryName', productController.getProductsByCategory || notImplemented);

// Produtos especiais
router.get('/featured', productController.getFeaturedProducts || notImplemented);
router.get('/search', productController.searchProducts || notImplemented);

module.exports = router;
