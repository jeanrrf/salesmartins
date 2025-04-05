const axios = require('axios');
const shopeeConfig = require('../config/shopeeConfig');
const fs = require('fs');
const path = require('path');

/**
 * Classe de serviço para interagir com a API de afiliados da Shopee
 */
class ShopeeService {
  constructor() {
    this.baseUrl = shopeeConfig.BASE_URL;
    this.apiKey = shopeeConfig.API_KEY;
    this.apiSecret = shopeeConfig.API_SECRET;
    this.categoriesFilePath = path.join(__dirname, '../routes/CATEGORIA.json');
    this.productsJsonPath = path.join(__dirname, '../data/products.json');

    // Garantir que o diretório data existe
    const dataDir = path.join(__dirname, '../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Criar arquivo de categorias se não existir
    if (!fs.existsSync(this.categoriesFilePath)) {
      fs.writeFileSync(this.categoriesFilePath, JSON.stringify([
        { category_id: "1", category_name: "Eletrônicos" },
        { category_id: "2", category_name: "Moda" },
        { category_id: "3", category_name: "Casa & Decoração" },
        { category_id: "4", category_name: "Beleza & Saúde" },
        { category_id: "5", category_name: "Esportes" }
      ]), 'utf-8');
    }

    this.instance = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      }
    });

    // Interceptor para tratamento de erros
    this.instance.interceptors.response.use(
      response => response,
      error => {
        console.error('Erro na API Shopee:', error.response?.data || error.message);
        throw error;
      }
    );
  }

  /**
   * Get products data from JSON file
   * @returns {Array} - Array of products from JSON
   */
  getProductsFromJson() {
    try {
      const rawData = fs.readFileSync(this.productsJsonPath, 'utf8');
      const jsonData = JSON.parse(rawData);
      return jsonData.data || [];
    } catch (error) {
      console.error('Error reading products from JSON:', error);
      return [];
    }
  }

  /**
   * Busca produtos na API da Shopee com base em uma palavra-chave
   * @param {Object} searchParams - Parâmetros de busca
   * @returns {Promise<Object>} - Resultado da busca de produtos
   */
  async searchProducts(searchParams) {
    try {
      const { keyword, categoryId, minPrice, maxPrice, minCommission, sortBy, limit = 20, page = 1 } = searchParams;
      
      // Obter produtos do arquivo JSON
      const allProducts = this.getProductsFromJson();
      
      // Aplicar filtros
      let filteredProducts = [...allProducts];
      
      if (keyword && typeof keyword === 'string') {
        const keywordLower = keyword.toLowerCase();
        filteredProducts = filteredProducts.filter(product => 
          product.name.toLowerCase().includes(keywordLower)
        );
      }
      
      if (categoryId) {
        filteredProducts = filteredProducts.filter(product => 
          product.category_id === categoryId
        );
      }
      
      if (minPrice !== undefined) {
        filteredProducts = filteredProducts.filter(product => 
          product.price >= minPrice
        );
      }
      
      if (maxPrice !== undefined) {
        filteredProducts = filteredProducts.filter(product => 
          product.price <= maxPrice
        );
      }
      
      if (minCommission !== undefined) {
        filteredProducts = filteredProducts.filter(product => 
          product.commission_rate >= minCommission
        );
      }
      
      // Ordenação
      switch(sortBy) {
        case 'sales':
          filteredProducts.sort((a, b) => b.sales - a.sales);
          break;
        case 'commission':
          filteredProducts.sort((a, b) => b.commission_rate - a.commission_rate);
          break;
        case 'price':
          filteredProducts.sort((a, b) => a.price - b.price);
          break;
        case 'discount':
          filteredProducts.sort((a, b) => {
            const discountA = ((a.original_price - a.price) / a.original_price) * 100;
            const discountB = ((b.original_price - b.price) / b.original_price) * 100;
            return discountB - discountA;
          });
          break;
        case 'rating':
          filteredProducts.sort((a, b) => b.rating_star - a.rating_star);
          break;
      }
      
      // Aplicar paginação
      const startIdx = (page - 1) * limit;
      const endIdx = startIdx + limit;
      const paginatedProducts = filteredProducts.slice(startIdx, endIdx);

      return {
        success: true,
        data: {
          products: paginatedProducts,
          totalCount: filteredProducts.length,
          page,
          limit,
          hasMore: endIdx < filteredProducts.length
        }
      };
    } catch (error) {
      console.error(`Erro ao buscar produtos:`, error);
      throw new Error(`Falha ao buscar produtos: ${error.message}`);
    }
  }

  /**
   * Obtém os dados de um produto específico
   * @param {string} productId - ID do produto
   * @returns {Promise<Object>} - Dados do produto
   */
  async getShopeeProductData(productId) {
    try {
      const products = this.getProductsFromJson();
      const product = products.find(p => 
        p.id.toString() === productId.toString() || 
        p.shopee_id?.toString() === productId.toString()
      );
      
      if (!product) {
        throw new Error(`Product with ID ${productId} not found`);
      }

      return product;
    } catch (error) {
      console.error(`Erro ao obter dados do produto ${productId}:`, error);
      throw new Error(`Falha ao obter dados do produto: ${error.message}`);
    }
  }

  /**
   * Obtém as categorias de produtos
   */
  async getProductCategories() {
    try {
      // Tentar carregar do arquivo de cache primeiro
      if (fs.existsSync(this.categoriesFilePath)) {
        const categoriesData = fs.readFileSync(this.categoriesFilePath, 'utf-8');
        const categories = JSON.parse(categoriesData);
        return { success: true, data: categories };
      }
      
      // Se não conseguir do arquivo, tentar da API
      // Implementar chamada à API Shopee aqui quando disponível
      // Por enquanto, retorna categorias padrão
      return { 
        success: false, 
        message: "Categories file not found and API call not implemented" 
      };
    } catch (error) {
      console.error('Error loading categories:', error);
      return { 
        success: false, 
        message: 'Failed to load categories',
        error: error.message 
      };
    }
  }

  /**
   * Obtém produtos recomendados com base no ID do produto
   * @param {string} productId - ID do produto
   * @param {number} limit - Número máximo de produtos a retornar
   * @returns {Promise<Object>} - Produtos recomendados
   */
  async getRecommendedProducts(productId, limit = 8) {
    try {
      const allProducts = this.getProductsFromJson();
      const product = await this.getShopeeProductData(productId);
      
      // Filtrar produtos da mesma categoria
      let similarProducts = allProducts.filter(p => 
        p.category_id === product.category_id && p.id !== product.id
      );
      
      // Ordenar por popularidade e limitar resultados
      similarProducts.sort((a, b) => b.sales - a.sales);
      const recommendations = similarProducts.slice(0, limit);
      
      return {
        success: true,
        data: {
          products: recommendations,
          totalCount: recommendations.length
        }
      };
    } catch (error) {
      console.error(`Erro ao obter produtos recomendados para ${productId}:`, error);
      throw new Error(`Falha ao obter produtos recomendados: ${error.message}`);
    }
  }

  /**
   * Obtém produtos em alta com base em palavras-chave ou categorias
   * @param {Object} params - Parâmetros da busca
   * @returns {Promise<Object>} - Produtos em alta
   */
  async getTrendingProducts(params) {
    try {
      const { keywords, categoryIds, minSales = 50, limit = 20 } = params;
      const allProducts = this.getProductsFromJson();
      
      let filteredProducts = [...allProducts];
      
      // Filtrar por categorias se fornecidas
      if (categoryIds && categoryIds.length > 0) {
        filteredProducts = filteredProducts.filter(product => 
          categoryIds.includes(product.category_id)
        );
      }
      
      // Filtrar por palavras-chave se fornecidas
      if (keywords && keywords.length > 0) {
        filteredProducts = filteredProducts.filter(product => {
          return keywords.some(keyword => 
            product.name.toLowerCase().includes(keyword.toLowerCase())
          );
        });
      }
      
      // Filtrar por vendas mínimas
      filteredProducts = filteredProducts.filter(product => 
        product.sales >= minSales
      );
      
      // Ordenar por número de vendas (tendência)
      filteredProducts.sort((a, b) => b.sales - a.sales);
      
      // Limitar resultados
      const trendingProducts = filteredProducts.slice(0, limit);
      
      return {
        success: true,
        data: {
          products: trendingProducts,
          totalCount: trendingProducts.length
        }
      };
    } catch (error) {
      console.error('Erro ao obter produtos em alta:', error);
      throw new Error(`Falha ao obter produtos em alta: ${error.message}`);
    }
  }
}

module.exports = new ShopeeService();