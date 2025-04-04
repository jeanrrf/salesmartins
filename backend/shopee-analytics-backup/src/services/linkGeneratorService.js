const shopeeService = require('./shopeeService');
const AffiliateLink = require('../models/affiliateLink');
const UserSettings = require('../models/userSettings');

/**
 * Serviço para geração e gerenciamento de links de afiliados
 */
class LinkGeneratorService {
  /**
   * Cria um link de afiliado para um produto
   * @param {string} userId - ID do usuário
   * @param {string} productId - ID do produto
   * @param {Object} options - Opções adicionais para o link
   * @returns {Promise<Object>} - O link de afiliado criado
   */
  async createAffiliateLink(userId, productId, options = {}) {
    try {
      // Obter dados do produto da API Shopee
      const productData = await shopeeService.getShopeeProductData(productId);
      if (!productData) {
        throw new Error('Produto não encontrado');
      }

      // Obter configurações do usuário para ID de afiliado
      const userSettings = await UserSettings.getOrCreate(userId);
      const affiliateId = userSettings.affiliate_id;
      
      if (!affiliateId) {
        throw new Error('ID de afiliado não configurado. Configure nas Configurações.');
      }
      
      // Gerar o link de afiliado
      const affiliateLinkResult = await shopeeService.generateAffiliateLink(
        affiliateId, 
        productId, 
        options
      );
      
      // Salvar o link no banco de dados
      const newLink = await AffiliateLink.create({
        user_id: userId,
        original_url: productData.url,
        affiliate_url: affiliateLinkResult.data.link,
        name: productData.name,
        product_details: JSON.stringify({
          itemId: productData.itemId,
          name: productData.name,
          price: productData.price,
          image: productData.image,
          categoryId: productData.categoryId,
          commissionRate: productData.commissionRate,
          campaign: options.campaignId || 'default',
          subId: options.subId || ''
        })
      });
      
      return {
        id: newLink.id,
        userId: newLink.user_id,
        name: newLink.name,
        originalUrl: newLink.original_url,
        affiliateUrl: newLink.affiliate_url,
        productDetails: JSON.parse(newLink.product_details || '{}'),
        createdAt: newLink.created_at
      };
    } catch (error) {
      throw new Error(`Erro ao gerar link de afiliado: ${error.message}`);
    }
  }

  /**
   * Cria links de afiliado em massa para múltiplos produtos
   * @param {string} userId - ID do usuário
   * @param {Array} products - Array de objetos de produtos
   * @param {Object} options - Opções adicionais para os links
   * @returns {Promise<Object>} - Resultado da geração em massa
   */
  async bulkCreateAffiliateLinks(userId, products, options = {}) {
    try {
      // Obter configurações do usuário para ID de afiliado
      const userSettings = await UserSettings.getOrCreate(userId);
      const affiliateId = userSettings.affiliate_id;
      
      if (!affiliateId) {
        throw new Error('ID de afiliado não configurado. Configure nas Configurações.');
      }
      
      const results = {
        totalProcessed: products.length,
        successCount: 0,
        errorCount: 0,
        links: []
      };
      
      // Processar cada produto da lista
      for (const product of products) {
        try {
          const productId = product.itemId || product.id;
          
          if (!productId) {
            throw new Error('ID do produto não fornecido');
          }
          
          // Obter dados do produto (ou usar os dados fornecidos se completos)
          let productData = product;
          if (!product.name || !product.price || !product.url) {
            const shopeeProductData = await shopeeService.getShopeeProductData(productId);
            if (shopeeProductData) {
              productData = {
                ...product,
                ...shopeeProductData
              };
            }
          }
          
          // Personalizar opções para este produto específico
          const productOptions = {
            ...options,
            subId: product.subId || options.subId
          };
          
          // Gerar link de afiliado
          const affiliateLinkResult = await shopeeService.generateAffiliateLink(
            affiliateId, 
            productId, 
            productOptions
          );
          
          // Salvar o link no banco de dados
          const newLink = await AffiliateLink.create({
            user_id: userId,
            original_url: productData.url,
            affiliate_url: affiliateLinkResult.data.link,
            name: productData.name || productData.productName,
            product_details: JSON.stringify({
              itemId: productId,
              name: productData.name || productData.productName,
              price: productData.price || productData.priceMin,
              image: productData.image || productData.imageUrl,
              categoryId: productData.categoryId,
              categoryName: productData.categoryName,
              commissionRate: productData.commissionRate,
              campaign: productOptions.campaignId || 'default',
              subId: productOptions.subId || ''
            })
          });
          
          results.successCount++;
          results.links.push({
            id: newLink.id,
            productId,
            name: newLink.name,
            affiliateUrl: newLink.affiliate_url,
            success: true
          });
          
        } catch (error) {
          results.errorCount++;
          results.links.push({
            productId: product.itemId || product.id,
            success: false,
            error: error.message
          });
        }
      }
      
      return results;
    } catch (error) {
      throw new Error(`Erro ao gerar links em massa: ${error.message}`);
    }
  }

  /**
   * Gera links sequenciais para múltiplos produtos
   * @param {string} userId - ID do usuário
   * @param {Array} products - Array de produtos
   * @param {Object} options - Opções para geração sequencial
   * @returns {Promise<Object>} - Resultado da geração
   */
  async generateSequentialLinks(userId, products, options = {}) {
    try {
      // Obter configurações do usuário para ID de afiliado
      const userSettings = await UserSettings.getOrCreate(userId);
      const affiliateId = userSettings.affiliate_id;
      
      if (!affiliateId) {
        throw new Error('ID de afiliado não configurado. Configure nas Configurações.');
      }
      
      const results = {
        totalProcessed: products.length,
        successCount: 0,
        errorCount: 0,
        links: []
      };
      
      // Definir número inicial da sequência
      let sequenceNumber = options.startingSequence || 1;
      
      // Processar cada produto da lista
      for (const product of products) {
        try {
          const productId = product.itemId || product.id;
          
          if (!productId) {
            throw new Error('ID do produto não fornecido');
          }
          
          // Obter dados do produto (ou usar os dados fornecidos se completos)
          let productData = product;
          if (!product.name || !product.price || !product.url) {
            const shopeeProductData = await shopeeService.getShopeeProductData(productId);
            if (shopeeProductData) {
              productData = {
                ...product,
                ...shopeeProductData
              };
            }
          }
          
          // Criar subID sequencial
          const sequentialSubId = `seq${sequenceNumber.toString().padStart(3, '0')}`;
          
          // Personalizar opções com o subID sequencial
          const productOptions = {
            ...options,
            subId: sequentialSubId
          };
          
          // Gerar link de afiliado
          const affiliateLinkResult = await shopeeService.generateAffiliateLink(
            affiliateId, 
            productId, 
            productOptions
          );
          
          // Salvar o link no banco de dados
          const newLink = await AffiliateLink.create({
            user_id: userId,
            original_url: productData.url,
            affiliate_url: affiliateLinkResult.data.link,
            name: productData.name || productData.productName,
            product_details: JSON.stringify({
              itemId: productId,
              name: productData.name || productData.productName,
              price: productData.price || productData.priceMin,
              image: productData.image || productData.imageUrl,
              categoryId: productData.categoryId,
              categoryName: productData.categoryName,
              commissionRate: productData.commissionRate,
              campaign: productOptions.campaignId || 'seq',
              subId: sequentialSubId
            })
          });
          
          results.successCount++;
          results.links.push({
            id: newLink.id,
            productId,
            name: newLink.name,
            affiliateUrl: newLink.affiliate_url,
            subId: sequentialSubId,
            success: true
          });
          
          // Incrementar o número da sequência para o próximo produto
          sequenceNumber++;
          
        } catch (error) {
          results.errorCount++;
          results.links.push({
            productId: product.itemId || product.id,
            success: false,
            error: error.message
          });
          
          // Ainda incrementamos a sequência mesmo em caso de erro
          sequenceNumber++;
        }
      }
      
      return results;
    } catch (error) {
      throw new Error(`Erro ao gerar links sequenciais: ${error.message}`);
    }
  }

  /**
   * Obtém um link de afiliado pelo ID
   * @param {string} id - ID do link
   * @returns {Promise<Object>} - O link de afiliado
   */
  async getAffiliateLinkById(id) {
    const link = await AffiliateLink.findById(id);
    
    if (!link) {
      throw new Error('Link de afiliado não encontrado');
    }
    
    return {
      id: link.id,
      userId: link.user_id,
      name: link.name,
      originalUrl: link.original_url,
      affiliateUrl: link.affiliate_url,
      productDetails: JSON.parse(link.product_details || '{}'),
      createdAt: link.created_at
    };
  }

  /**
   * Obtém todos os links de afiliado de um usuário
   * @param {string} userId - ID do usuário
   * @returns {Promise<Array>} - Lista de links de afiliado
   */
  async getAffiliateLinks(userId) {
    const links = await AffiliateLink.findByUserId(userId);
    
    return links.map(link => ({
      id: link.id,
      userId: link.user_id,
      name: link.name,
      originalUrl: link.original_url,
      affiliateUrl: link.affiliate_url,
      productDetails: JSON.parse(link.product_details || '{}'),
      createdAt: link.created_at,
      updatedAt: link.updated_at
    }));
  }

  /**
   * Atualiza um link de afiliado
   * @param {string} id - ID do link
   * @param {string} userId - ID do usuário (para verificar propriedade)
   * @param {Object} updateData - Dados a atualizar
   * @returns {Promise<Object>} - Link atualizado
   */
  async updateAffiliateLink(id, userId, updateData) {
    // Verificar se o link existe e pertence ao usuário
    const link = await AffiliateLink.findById(id);
    
    if (!link) {
      throw new Error('Link de afiliado não encontrado');
    }
    
    if (link.user_id !== userId) {
      throw new Error('Você não tem permissão para atualizar este link');
    }
    
    // Atualizar o link
    const updatedLink = await AffiliateLink.update(id, updateData);
    
    return {
      id: updatedLink.id,
      userId: updatedLink.user_id,
      name: updatedLink.name,
      originalUrl: updatedLink.original_url,
      affiliateUrl: updatedLink.affiliate_url,
      productDetails: JSON.parse(updatedLink.product_details || '{}'),
      createdAt: updatedLink.created_at,
      updatedAt: updatedLink.updated_at
    };
  }

  /**
   * Exclui um link de afiliado
   * @param {string} id - ID do link
   * @param {string} userId - ID do usuário (para verificar propriedade)
   * @returns {Promise<Object>} - Resultado da exclusão
   */
  async deleteAffiliateLink(id, userId) {
    // Verificar se o link existe e pertence ao usuário
    const link = await AffiliateLink.findById(id);
    
    if (!link) {
      throw new Error('Link de afiliado não encontrado');
    }
    
    if (link.user_id !== userId) {
      throw new Error('Você não tem permissão para excluir este link');
    }
    
    // Excluir o link
    const deleted = await AffiliateLink.delete(id);
    
    return {
      deleted,
      message: deleted ? 'Link de afiliado excluído com sucesso' : 'Não foi possível excluir o link de afiliado'
    };
  }
}

module.exports = new LinkGeneratorService();