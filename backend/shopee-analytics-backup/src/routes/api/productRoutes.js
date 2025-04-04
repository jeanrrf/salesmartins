const express = require('express');
const router = express.Router();
const productsController = require('../../controllers/productsController');

// Rota para obter produtos com filtros
router.get('/', productsController.getProducts);

// Rota para obter produtos especiais (promoções, bem avaliados, etc.)
router.get('/special', productsController.getSpecialProducts);

module.exports = router;
