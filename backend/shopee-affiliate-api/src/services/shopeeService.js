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
    this.repairedProducts = new Set(); // To track repaired products

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
   * Busca produtos na API da Shopee com base em uma palavra-chave
   * @param {string} keyword - Palavra-chave para busca
   * @param {number} limit - Quantidade de produtos a retornar
   * @param {number} page - Página de resultados
   * @returns {Promise<Object>} - Resultado da busca de produtos
   */
  async searchProducts(keyword, limit = 20, page = 1) {
    try {
      // Mock para desenvolvimento - simular resposta da API
      // Em produção, substituir por chamada real à API
      const mockData = this._generateMockProducts(keyword, limit, page);

      // Em produção, descomentar:
      /*
      const response = await this.instance.post('/product/search', {
        keyword,
        limit,
        page
      });
      return response.data;
      */

      return {
        success: true,
        data: {
          products: mockData.products,
          totalCount: mockData.totalCount,
          page,
          limit,
          hasMore: mockData.products.length === limit
        }
      };
    } catch (error) {
      console.error(`Erro ao buscar produtos com a palavra-chave "${keyword}":`, error);
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
      // Mock para desenvolvimento
      // Em produção, substituir pela chamada real à API
      const mockProduct = this._generateMockProduct(productId);

      // Em produção, descomentar:
      /*
      const response = await this.instance.get(`/product/${productId}`);
      return response.data;
      */

      return mockProduct;
    } catch (error) {
      console.error(`Erro ao obter dados do produto ${productId}:`, error);
      throw new Error(`Falha ao obter dados do produto: ${error.message}`);
    }
  }

  /**
   * Obtém as categorias de produtos do arquivo CATEGORIA.json
   * @returns {Promise<Array>} - Lista de categorias
   */
  async getProductCategories() {
    try {
      const categoriesData = fs.readFileSync(this.categoriesFilePath, 'utf-8');
      const categories = JSON.parse(categoriesData);
      return { success: true, data: categories };
    } catch (error) {
      console.error('Erro ao carregar categorias do arquivo:', error);
      throw new Error('Falha ao carregar categorias.');
    }
  }

  /**
   * Obtém produtos de uma categoria específica
   * @param {string} categoryId - ID da categoria
   * @param {number} limit - Quantidade de produtos a retornar
   * @param {number} page - Página de resultados
   * @returns {Promise<Object>} - Resultado da busca de produtos por categoria
   */
  async getProductsByCategory(categoryId, limit = 20, page = 1) {
    try {
      // Mock para desenvolvimento
      // Em produção, substituir pela chamada real à API
      const mockData = this._generateMockProductsByCategory(categoryId, limit, page);

      // Em produção, descomentar:
      /*
      const response = await this.instance.get(`/category/${categoryId}/products`, {
        params: { limit, page }
      });
      return response.data;
      */

      return {
        success: true,
        data: {
          products: mockData.products,
          categoryInfo: mockData.categoryInfo,
          totalCount: mockData.totalCount,
          page,
          limit,
          hasMore: mockData.products.length === limit
        }
      };
    } catch (error) {
      console.error(`Erro ao buscar produtos da categoria ${categoryId}:`, error);
      throw new Error(`Falha ao buscar produtos da categoria: ${error.message}`);
    }
  }

  /**
   * Registra um clique em um link de afiliado
   * @param {string} linkId - ID do link de afiliado
   * @param {string} userId - ID do usuário
   * @returns {Promise<Object>} - Resultado do registro de clique
   */
  async trackAffiliateClick(linkId, userId) {
    try {
      // Em desenvolvimento, apenas simulamos o registro
      console.log(`Clique registrado no link ${linkId} pelo usuário ${userId}`);

      // Em produção, descomentar:
      /*
      const response = await this.instance.post(`/affiliate/link/${linkId}/track`, {
        userId
      });
      return response.data;
      */

      return { success: true };
    } catch (error) {
      console.error(`Erro ao registrar clique no link ${linkId}:`, error);
      throw new Error(`Falha ao registrar clique: ${error.message}`);
    }
  }

  /**
   * Registra uma conversão (venda) através de link afiliado
   * @param {string} linkId - ID do link de afiliado
   * @param {string} orderId - ID do pedido
   * @param {number} orderValue - Valor do pedido
   * @returns {Promise<Object>} - Resultado do registro da conversão
   */
  async recordConversion(linkId, orderId, orderValue) {
    try {
      // Em desenvolvimento, apenas simulamos o registro
      console.log(`Conversão registrada para o link ${linkId}, pedido ${orderId}, valor ${orderValue}`);

      // Em produção, descomentar:
      /*
      const response = await this.instance.post(`/affiliate/link/${linkId}/conversion`, {
        orderId,
        orderValue
      });
      return response.data;
      */

      return { success: true };
    } catch (error) {
      console.error(`Erro ao registrar conversão para o link ${linkId}:`, error);
      throw new Error(`Falha ao registrar conversão: ${error.message}`);
    }
  }

  /**
   * Gera um link de afiliado para um produto
   * @param {string} userId - ID do usuário afiliado
   * @param {string} productId - ID do produto
   * @param {Object} options - Opções adicionais para o link
   * @returns {Promise<Object>} - Dados do link de afiliado gerado
   */
  async generateAffiliateLink(userId, productId, options = {}) {
    try {
      // Em desenvolvimento, geramos um link fictício
      const productData = await this.getShopeeProductData(productId);
      const campaignId = options.campaignId || 'default';
      const subId = options.subId || '';

      const affiliateLink = `https://shope.ee/affiliate/${userId}/${productId}?campaign=${campaignId}&sub_id=${subId}`;

      // Em produção, descomentar:
      /*
      const response = await this.instance.post('/affiliate/link/create', {
        userId,
        productId,
        ...options
      });
      return response.data;
      */

      return {
        success: true,
        data: {
          link: affiliateLink,
          productData,
          userId,
          campaign: campaignId,
          subId
        }
      };
    } catch (error) {
      console.error(`Erro ao gerar link de afiliado para o produto ${productId}:`, error);
      throw new Error(`Falha ao gerar link de afiliado: ${error.message}`);
    }
  }

  /**
   * Marca um produto como reparado para evitar duplicação
   * @param {string} productId - ID do produto
   */
  markProductAsRepaired(productId) {
    this.repairedProducts.add(productId);
  }

  /**
   * Verifica se um produto já foi reparado
   * @param {string} productId - ID do produto
   * @returns {boolean} - Verdadeiro se o produto já foi reparado
   */
  isProductRepaired(productId) {
    return this.repairedProducts.has(productId);
  }

  /**
   * Gera dados simulados de produtos para testes
   * @private
   */
  _generateMockProducts(keyword, limit, page) {
    const products = [];
    const startIndex = (page - 1) * limit;
    const totalCount = 120; // Simula um total de produtos

    // Gerar produtos simulados
    for (let i = 0; i < limit && (startIndex + i) < totalCount; i++) {
      const productId = (startIndex + i + 1).toString();
      products.push({
        itemId: productId,
        name: `Produto ${keyword} ${productId}`,
        price: Math.floor(Math.random() * 1000) + 10,
        priceMin: Math.floor(Math.random() * 900) + 10,
        priceMax: Math.floor(Math.random() * 500) + 1000,
        image: `https://picsum.photos/seed/${productId}/200/200`,
        categoryId: Math.floor(Math.random() * 10) + 100000,
        sales: Math.floor(Math.random() * 1000),
        commissionRate: (Math.random() * 0.1).toFixed(2),
        ratingStar: (Math.random() * 5).toFixed(1),
        shopId: Math.floor(Math.random() * 1000) + 1,
        shopName: `Loja ${Math.floor(Math.random() * 100)}`,
        shopLocation: "Brasil"
      });
    }

    return {
      products,
      totalCount
    };
  }

  /**
   * Gera dados simulados de um produto específico
   * @private
   */
  _generateMockProduct(productId) {
    return {
      itemId: productId,
      name: `Produto ${productId}`,
      price: Math.floor(Math.random() * 1000) + 10,
      priceMin: Math.floor(Math.random() * 900) + 10,
      priceMax: Math.floor(Math.random() * 500) + 1000,
      image: `https://picsum.photos/seed/${productId}/200/200`,
      url: `https://shopee.com.br/product/${productId}`,
      categoryId: Math.floor(Math.random() * 10) + 100000,
      sales: Math.floor(Math.random() * 1000),
      commissionRate: (Math.random() * 0.1).toFixed(2),
      ratingStar: (Math.random() * 5).toFixed(1),
      shopId: Math.floor(Math.random() * 1000) + 1,
      shopName: `Loja ${Math.floor(Math.random() * 100)}`,
      shopLocation: "Brasil",
      description: `Descrição detalhada do produto ${productId}. Este é um produto de alta qualidade.`
    };
  }

  /**
   * Gera categorias simuladas para testes
   * @private
   */
  _generateMockCategories() {
    return [
      { id: "100001", name: "Eletrônicos", level: 1 },
      { id: "100002", name: "Celulares & Acessórios", level: 1 },
      { id: "100003", name: "Computadores & Acessórios", level: 1 },
      { id: "100006", name: "TVs & Acessórios", level: 1 },
      { id: "100007", name: "Áudio", level: 1 },
      { id: "100013", name: "Câmeras & Acessórios", level: 1 },
      { id: "100016", name: "Jogos", level: 1 },
      { id: "100018", name: "Moda Feminina", level: 1 },
      { id: "100019", name: "Moda Masculina", level: 1 },
      { id: "100022", name: "Relógios", level: 1 },
      { id: "100024", name: "Bolsas & Malas", level: 1 },
      { id: "100039", name: "Casa & Decoração", level: 1 },
      { id: "100040", name: "Bebês & Crianças", level: 1 },
      { id: "100041", name: "Beleza", level: 1 },
      { id: "100042", name: "Esportes & Lazer", level: 1 }
    ];
  }

  /**
   * Gera produtos simulados por categoria para testes
   * @private
   */
  _generateMockProductsByCategory(categoryId, limit, page) {
    const products = [];
    const startIndex = (page - 1) * limit;
    const totalCount = 80; // Simula um total de produtos para a categoria

    // Buscar informações da categoria
    const allCategories = this._generateMockCategories();
    const categoryInfo = allCategories.find(cat => cat.id === categoryId) || {
      id: categoryId,
      name: `Categoria ${categoryId}`,
      level: 1
    };

    // Gerar produtos simulados para esta categoria
    for (let i = 0; i < limit && (startIndex + i) < totalCount; i++) {
      const productId = `${categoryId}-${startIndex + i + 1}`;
      products.push({
        itemId: productId,
        name: `Produto ${categoryInfo.name} ${i + 1}`,
        price: Math.floor(Math.random() * 1000) + 10,
        priceMin: Math.floor(Math.random() * 900) + 10,
        priceMax: Math.floor(Math.random() * 500) + 1000,
        image: `https://picsum.photos/seed/${productId}/200/200`,
        categoryId: categoryId,
        categoryName: categoryInfo.name,
        sales: Math.floor(Math.random() * 500),
        commissionRate: (Math.random() * 0.1).toFixed(2),
        ratingStar: (Math.random() * 5).toFixed(1),
        shopId: Math.floor(Math.random() * 1000) + 1,
        shopName: `Loja ${Math.floor(Math.random() * 100)}`,
        shopLocation: "Brasil"
      });
    }

    return {
      products,
      categoryInfo,
      totalCount
    };
  }
}

module.exports = new ShopeeService();