const express = require('express');
const affiliateController = require('../controllers/affiliateController');
const auth = require('../middleware/auth');
const router = express.Router();

// Route to create an affiliate link
router.post('/links', auth, affiliateController.createAffiliateLink);

// Route to get all affiliate links
router.get('/links', auth, affiliateController.getAffiliateLinks);

// Routes for uncategorized products or category issues
router.get('/uncategorized-products', affiliateController.getUncategorizedProducts);
router.post('/products/update-categories', affiliateController.updateProductCategories);

// Routes for categories and products
router.get('/categories', affiliateController.getProductCategories);
router.get('/products/special', affiliateController.getSpecialProducts);
router.get('/products', affiliateController.getDatabaseProducts);
router.get('/category/:categoryId/products', affiliateController.getProductsByCategory);

// Additional routes can be added here as needed

module.exports = router;