const express = require('express');
const router = express.Router();

// Define fallback handler for undefined controller methods
const notImplemented = (req, res) => {
    res.status(501).json({ error: "Este endpoint ainda não está implementado" });
};

// Rotas de administração
router.get('/dashboard', notImplemented);
router.get('/users', notImplemented);
router.get('/users/:id', notImplemented);
router.put('/users/:id', notImplemented);
router.delete('/users/:id', notImplemented);
router.get('/products/manage', notImplemented);
router.get('/analytics', notImplemented);
router.post('/settings', notImplemented);
router.get('/settings', notImplemented);

module.exports = router;
