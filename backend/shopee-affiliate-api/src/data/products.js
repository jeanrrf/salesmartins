const fs = require('fs');
const path = require('path');

/**
 * Helper service para acessar dados de produtos
 */
const productsJsonPath = path.join(__dirname, './products.json');

// Função para obter produtos do JSON
const getProducts = () => {
  try {
    const rawData = fs.readFileSync(productsJsonPath, 'utf8');
    const jsonData = JSON.parse(rawData);
    return jsonData.data || [];
  } catch (error) {
    console.error('Error reading products from JSON:', error);
    return [];
  }
};

const getProductById = (id) => getProducts().find(product => product.id === id);
const getProductsByCategory = (categoryId) => 
  getProducts().filter(product => product.category_id === categoryId);

module.exports = {
  getProducts,
  getProductById,
  getProductsByCategory
};