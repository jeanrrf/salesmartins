const express = require('express');
const router = express.Router();

// Define fallback handler for undefined controller methods
const notImplemented = (req, res) => {
    res.status(501).json({ error: "Este endpoint ainda não está implementado" });
};

// Rotas para reparação de categorias
router.get('/', notImplemented); // Listar categorias que precisam de reparo
router.post('/:categoryId', notImplemented); // Reparar uma categoria específica
router.put('/:categoryId', notImplemented); // Atualizar uma categoria
router.delete('/:categoryId', notImplemented); // Excluir uma categoria

module.exports = router;
