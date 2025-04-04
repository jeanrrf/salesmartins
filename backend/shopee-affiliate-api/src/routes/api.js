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
const fs = require('fs');
const path = require('path');

// Importar rotas de produtos
const productRoutes = require('./api/productRoutes');

// Affiliate routes - Acessíveis para todos os usuários autenticados
router.post('/affiliate/link', authMiddleware, validateAffiliateLink, affiliateController.createAffiliateLink);
router.get('/affiliate/links', authMiddleware, affiliateController.getAffiliateLinks);
router.get('/affiliate/link/:id', authMiddleware, affiliateController.getAffiliateLinkById);
router.delete('/affiliate/link/:id', authMiddleware, affiliateController.deleteAffiliateLink);
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

// Rota para categorias de produtos - Acessível para todos
router.get('/affiliate/categories', affiliateController.getProductCategories);
router.get('/affiliate/category/:categoryId/products', affiliateController.getProductsByCategory);

// Rotas restritas apenas para admins
router.post('/affiliate/bulk-create', authMiddleware, restrictTo('admin'), affiliateController.bulkCreateAffiliateLinks);
router.post('/affiliate/generate-sequential', authMiddleware, restrictTo('admin'), affiliateController.generateSequentialLinks);
router.post('/affiliate/link/:linkId/track', authMiddleware, affiliateController.trackAffiliateClick);
router.post('/affiliate/link/:linkId/conversion', authMiddleware, affiliateController.recordConversion);

// Evitar conflito de rotas
// Rotas para produtos especiais (para o componente SpecialProductsSection)
router.use('/products/special', productRoutes);

// Rota para buscar produtos do banco de dados - Acessível para todos
router.get('/products', affiliateController.getDatabaseProducts);

// Rotas restritas para admin
router.get('/uncategorized-products', authMiddleware, restrictTo('admin'), async (req, res) => {
  const { keyword, limit, page } = req.query;
  try {
    const products = await shopeeService.searchProducts(keyword, limit, page);
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rota para reparo de produtos - Restrita a admins
router.post('/products/:id/repair', authMiddleware, restrictTo('admin'), affiliateController.repairProductCategories);

// Atualizar /api/categories para servir diretamente os dados das categorias - Acessível para todos
router.get('/api/categories', async (req, res) => {
  console.log('Rota /api/categories foi chamada');
  try {
    const categories = await shopeeService.getProductCategories();
    console.log('Categorias retornadas:', categories);
    res.status(200).json(categories);
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar categorias.' });
  }
});

// Endpoint to serve categories from CATEGORIA.json - Acessível para todos
router.get('/categories', (req, res) => {
  const filePath = path.join(__dirname, 'CATEGORIA.json');

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Erro ao ler o arquivo CATEGORIA.json:', err);
      return res.status(500).json({ success: false, message: 'Erro ao carregar categorias.' });
    }

    try {
      const categories = JSON.parse(data);
      res.status(200).json(categories);
    } catch (parseError) {
      console.error('Erro ao analisar o arquivo CATEGORIA.json:', parseError);
      res.status(500).json({ success: false, message: 'Erro ao processar categorias.' });
    }
  });
});

// Authentication routes - Acessíveis para todos
router.post('/auth/login', authController.login);
router.post('/auth/register', authController.register);
router.get('/auth/validate', authController.validateToken);
router.post('/auth/renew', authMiddleware, authController.renewToken);

// Rota de perfil - Acessível para todos os usuários autenticados
router.put('/auth/profile', authMiddleware, authController.updateProfile);

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