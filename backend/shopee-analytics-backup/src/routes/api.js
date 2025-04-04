const express = require('express');
const router = express.Router();
const affiliateController = require('../controllers/affiliateController');
const authController = require('../controllers/authController');
const statsController = require('../controllers/statsController');
const settingsController = require('../controllers/settingsController');
const authMiddleware = require('../middleware/auth');
const { validateAffiliateLink } = require('../middleware/validator');
const { restrictTo, checkPermission } = require('../middleware/roleBasedAccess');
const shopeeService = require('../services/shopeeService');

// Importar rotas de produtos
const productRoutes = require('./api/productRoutes');
const productsController = require('../controllers/productsController');

// Affiliate routes - Acessíveis para todos os usuários autenticados
router.post('/affiliate/link', authMiddleware, validateAffiliateLink, affiliateController.createAffiliateLink);
router.get('/affiliate/links', authMiddleware, affiliateController.getAffiliateLinks);
router.get('/affiliate/link/:id', authMiddleware, affiliateController.getAffiliateLinkById);
router.delete('/affiliate/link/:id', authMiddleware, affiliateController.deleteAffiliateLink);

// Search routes
router.get('/affiliate/search', async (req, res) => {
  try {
    const { keywords, limit = 25 } = req.query;
    if (!keywords) {
      return res.status(400).json({ error: 'Parâmetro "keywords" é obrigatório.' });
    }
    const products = await affiliateController.searchProducts({ keywords, limit });
    res.json(products);
  } catch (error) {
    console.error('Erro na rota /affiliate/search:', error);
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
});

// Category routes - Unificar todas as rotas de categoria para usar o affiliateController
router.get('/categories', affiliateController.getProductCategories);
router.get('/affiliate/categories', affiliateController.getProductCategories);

// Product routes
router.get('/affiliate/products', affiliateController.getDatabaseProducts);
router.get('/affiliate/products/special', productsController.getSpecialProducts);
router.get('/products', affiliateController.getDatabaseProducts);
router.get('/products/special', productsController.getSpecialProducts);

// Rotas restritas apenas para admins
router.post('/affiliate/bulk-create', authMiddleware, restrictTo('admin'), affiliateController.bulkCreateAffiliateLinks);
router.post('/affiliate/generate-sequential', authMiddleware, restrictTo('admin'), affiliateController.generateSequentialLinks);
router.post('/affiliate/link/:linkId/track', authMiddleware, affiliateController.trackAffiliateClick);
router.post('/affiliate/link/:linkId/conversion', authMiddleware, affiliateController.recordConversion);

// Rota para buscar produtos do banco de dados - Acessível para todos
router.get('/products', affiliateController.getDatabaseProducts);

// Rotas restritas para admin
router.get('/uncategorized-products', authMiddleware, restrictTo('admin'), affiliateController.getUncategorizedProducts);
router.post('/products/:id/repair', authMiddleware, restrictTo('admin'), affiliateController.repairProductCategories);

// Authentication routes - Acessíveis para todos
router.post('/auth/login', authController.login);
router.post('/auth/register', authController.register);
router.get('/auth/validate', authController.validateToken);
router.post('/auth/renew', authMiddleware, authController.renewToken);

// Estatísticas - Restritas a admins
router.get('/stats', authMiddleware, restrictTo('admin'), statsController.getStats);
router.get('/stats/user', authMiddleware, statsController.getUserStats);
router.get('/stats/date-range', authMiddleware, statsController.getStatsByDateRange);
router.get('/stats/dashboard', authMiddleware, restrictTo('admin'), statsController.getDashboardStats);

// Configurações do usuário - Parcialmente restritas
router.get('/settings', authMiddleware, settingsController.getUserSettings);
router.put('/settings', authMiddleware, settingsController.updateUserSettings);

// Configurações avançadas - Restritas a admins
router.post('/settings/validate-affiliate', authMiddleware, restrictTo('admin'), settingsController.validateAffiliateId);
router.get('/settings/notifications', authMiddleware, settingsController.getNotificationPreferences);

module.exports = router;