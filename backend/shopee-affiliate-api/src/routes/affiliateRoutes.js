const express = require('express');
const router = express.Router();
const affiliateController = require('../controllers/affiliateController');

// Rotas para produtos
router.get('/products', affiliateController.getDatabaseProducts);
router.get('/products/special', affiliateController.getSpecialProducts);
router.get('/category/:categoryId/products', affiliateController.getProductsByCategory);

// Rotas para links de afiliado
router.post('/link', affiliateController.createAffiliateLink);
router.get('/links', affiliateController.getAffiliateLinks);
router.get('/link/:id', affiliateController.getAffiliateLinkById);
router.delete('/link/:id', affiliateController.deleteAffiliateLink);

// Rotas para busca
router.get('/search', affiliateController.searchProducts);

module.exports = router;
