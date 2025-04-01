const { dbAll, dbGet, dbRun } = require('../db/database');
const fs = require('fs').promises;
const path = require('path');

// Obter todas as categorias
const getAllCategories = async (req, res) => {
  try {
    // Primeiro tenta buscar do banco de dados
    const categories = await dbAll('SELECT * FROM categories ORDER BY name');
    
    // Se encontrou categorias no banco de dados, retorna
    if (categories && categories.length > 0) {
      return res.json(categories);
    }
    
    // Se não encontrou no banco, tenta carregar do arquivo JSON
    const categoriesPath = path.join(__dirname, '../CATEGORIA.json');
    try {
      const data = await fs.readFile(categoriesPath, 'utf8');
      const jsonCategories = JSON.parse(data);
      return res.json(jsonCategories);
    } catch (fileError) {
      console.error('Erro ao ler arquivo de categorias:', fileError);
      return res.json({ 
        message: 'Categorias não encontradas no banco de dados ou arquivo',
        categories: [] 
      });
    }
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    return res.status(500).json({ error: 'Erro ao buscar categorias' });
  }
};

// Obter todos os produtos
const getAllProducts = async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 100;
    const offset = req.query.offset ? parseInt(req.query.offset) : 0;
    
    const products = await dbAll(
      'SELECT * FROM products ORDER BY id LIMIT ? OFFSET ?', 
      [limit, offset]
    );
    
    return res.json({ products, count: products.length });
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    return res.status(500).json({ error: 'Erro ao buscar produtos' });
  }
};

// Buscar produtos por termo
const searchProducts = async (req, res) => {
  try {
    const searchTerm = req.query.q || '';
    const limit = req.query.limit ? parseInt(req.query.limit) : 100;
    
    if (!searchTerm.trim()) {
      return res.status(400).json({ error: 'Termo de busca não fornecido' });
    }
    
    const products = await dbAll(
      `SELECT * FROM products 
       WHERE name LIKE ? OR description LIKE ? 
       ORDER BY id LIMIT ?`,
      [`%${searchTerm}%`, `%${searchTerm}%`, limit]
    );
    
    return res.json({ 
      results: products, 
      count: products.length,
      searchTerm
    });
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    return res.status(500).json({ error: 'Erro ao buscar produtos' });
  }
};

// Exportar os controladores
module.exports = {
  getAllCategories,
  getAllProducts,
  searchProducts
};