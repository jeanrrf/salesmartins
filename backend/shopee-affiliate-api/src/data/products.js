<<<<<<< HEAD
// Dados estáticos dos produtos
const products = [
  {
    id: 1,
    itemId: "123456789",
    name: "Smartphone XiaomiX Pro 128GB",
    price: 1299.99,
    originalPrice: 1899.99,
    imageUrl: "https://cf.shopee.com.br/file/sg-11134201-22110-dyncdf7qxgkvbc",
    categoryId: "cel",
    categoryName: "Celulares e Smartphones",
    commissionRate: 0.08,
    ratingStar: 4.8,
    sales: 5234,
    shopId: "shop123",
    shopName: "Loja Oficial Xiaomi",
    freeShipping: true,
    tags: ["Lançamento", "Mais Vendido"]
  },
  {
    id: 2,
    itemId: "987654321",
    name: "Notebook Gamer Legion i7 RTX3060",
    price: 5499.99,
    originalPrice: 7299.99,
    imageUrl: "https://cf.shopee.com.br/file/sg-11134201-22110-1vl8gs7qxgkv52",
    categoryId: "info",
    categoryName: "Informática",
    commissionRate: 0.06,
    ratingStar: 4.9,
    sales: 856,
    shopId: "shop456",
    shopName: "Legion Store",
    freeShipping: true,
    tags: ["Premium", "Gamer"]
  },
  {
    id: 3,
    itemId: "456789123",
    name: "Fone Bluetooth TWS Com Case",
    price: 89.99,
    originalPrice: 199.99,
    imageUrl: "https://cf.shopee.com.br/file/sg-11134201-22110-hj6tdf7qxgkv8c",
    categoryId: "elet",
    categoryName: "Eletrônicos",
    commissionRate: 0.12,
    ratingStar: 4.5,
    sales: 12589,
    shopId: "shop789",
    shopName: "Tech Imports",
    freeShipping: false,
    tags: ["Promoção", "Mais Vendido"]
  },
  {
    id: 4,
    itemId: "789123456",
    name: "Kit 10 Máscaras Faciais Reutilizáveis",
    price: 29.99,
    originalPrice: 49.99,
    imageUrl: "https://cf.shopee.com.br/file/sg-11134201-22110-p87tdf7qxgkv74",
    categoryId: "saud",
    categoryName: "Saúde",
    commissionRate: 0.15,
    ratingStar: 4.7,
    sales: 45678,
    shopId: "shop012",
    shopName: "Saúde & Cia",
    freeShipping: true,
    tags: ["Essencial", "Proteção"]
  },
  {
    id: 5,
    itemId: "321654987",
    name: "Cafeteira Elétrica Programável",
    price: 249.99,
    originalPrice: 399.99,
    imageUrl: "https://cf.shopee.com.br/file/sg-11134201-22110-kj6tdf7qxgkv63",
    categoryId: "casa",
    categoryName: "Casa e Cozinha",
    commissionRate: 0.10,
    ratingStar: 4.6,
    sales: 3421,
    shopId: "shop345",
    shopName: "Casa Bonita",
    freeShipping: true,
    tags: ["Eletroportáteis", "Café"]
  },
  {
    id: 6,
    itemId: "654987321",
    name: "Tênis Esportivo Running Pro",
    price: 159.99,
    originalPrice: 299.99,
    imageUrl: "https://cf.shopee.com.br/file/sg-11134201-22110-df7qxgkv85",
    categoryId: "esp",
    categoryName: "Esportes",
    commissionRate: 0.09,
    ratingStar: 4.4,
    sales: 2876,
    shopId: "shop678",
    shopName: "Sports Center",
    freeShipping: false,
    tags: ["Corrida", "Conforto"]
  },
  {
    id: 7,
    itemId: "147258369",
    name: "Vestido Floral Primavera",
    price: 79.99,
    originalPrice: 149.99,
    imageUrl: "https://cf.shopee.com.br/file/sg-11134201-22110-df7qxgkv96",
    categoryId: "mod",
    categoryName: "Moda Feminina",
    commissionRate: 0.13,
    ratingStar: 4.3,
    sales: 5643,
    shopId: "shop901",
    shopName: "Fashion Store",
    freeShipping: true,
    tags: ["Verão", "Tendência"]
  },
  {
    id: 8,
    itemId: "369258147",
    name: "Kit Maquiagem Profissional",
    price: 129.99,
    originalPrice: 249.99,
    imageUrl: "https://cf.shopee.com.br/file/sg-11134201-22110-df7qxgkv74",
    categoryId: "bel",
    categoryName: "Beleza",
    commissionRate: 0.14,
    ratingStar: 4.7,
    sales: 7890,
    shopId: "shop234",
    shopName: "Beauty Plus",
    freeShipping: true,
    tags: ["Maquiagem", "Profissional"]
  },
  {
    id: 9,
    itemId: "258369147",
    name: "Console Videogame Portátil",
    price: 399.99,
    originalPrice: 599.99,
    imageUrl: "https://cf.shopee.com.br/file/sg-11134201-22110-df7qxgkv52",
    categoryId: "game",
    categoryName: "Games",
    commissionRate: 0.07,
    ratingStar: 4.8,
    sales: 1234,
    shopId: "shop567",
    shopName: "Game World",
    freeShipping: true,
    tags: ["Portátil", "Diversão"]
  },
  {
    id: 10,
    itemId: "963852741",
    name: "Conjunto Panelas Antiaderentes",
    price: 189.99,
    originalPrice: 299.99,
    imageUrl: "https://cf.shopee.com.br/file/sg-11134201-22110-df7qxgkv41",
    categoryId: "casa",
    categoryName: "Casa e Cozinha",
    commissionRate: 0.11,
    ratingStar: 4.6,
    sales: 4567,
    shopId: "shop890",
    shopName: "Utilidades Dom",
    freeShipping: true,
    tags: ["Cozinha", "Qualidade"]
  }
];

// Funções helper para buscar produtos
const getProducts = () => products;
const getProductById = (id) => products.find(product => product.id === id);
const getProductsByCategory = (categoryId) => 
  products.filter(product => product.categoryId === categoryId);

module.exports = {
  products,
=======
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
>>>>>>> 3fbd867e94ef973fb779444846fcfcee10c73c87
  getProducts,
  getProductById,
  getProductsByCategory
};