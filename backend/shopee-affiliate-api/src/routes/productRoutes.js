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

// Removida a rota duplicada /affiliate/categories que deve estar em affiliateRoutes.js

module.exports = router;

// Verifique se as rotas incluem todos os endpoints necessários
router.get('/products', productController.getProducts);
router.get('/products/featured', productController.getFeaturedProducts);
router.get('/products/categories', productController.getCategories);
router.get('/products/category/:categoryName', productController.getProductsByCategory);
router.get('/products/search', productController.searchProducts);
router.get('/affiliate/categories', productController.getCategories);
