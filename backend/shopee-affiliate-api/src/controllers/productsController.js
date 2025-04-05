const path = require('path');
const fs = require('fs');
const ShopeeService = require('../services/shopeeService');

class ProductsController {
  async getProducts(req, res) {
    console.log('GET /api/products called');
    try {
      const products = ShopeeService.getProductsFromJson();
      console.log('Total products available:', products.length);
      
      const { 
        page = 1, 
        limit = 12, 
        category = null, 
        search = null,
        sortBy = 'sales',
        minPrice = null,
        maxPrice = null,
        minCommission = null,
        minDiscount = null,
        minRating = null
      } = req.query;
      
      let filteredProducts = [...products];
      console.log('Initial products count:', filteredProducts.length);
      
      // Aplicar filtros
      if (category && category !== 'all') {
        filteredProducts = filteredProducts.filter(p => p.category_id === category);
        console.log('After category filter:', filteredProducts.length);
      }
      
      if (search) {
        const searchLower = search.toLowerCase();
        filteredProducts = filteredProducts.filter(p => 
          p.name.toLowerCase().includes(searchLower));
        console.log('After search filter:', filteredProducts.length);
      }
      
      if (minPrice !== null) {
        filteredProducts = filteredProducts.filter(p => p.price >= parseFloat(minPrice));
      }
      
      if (maxPrice !== null) {
        filteredProducts = filteredProducts.filter(p => p.price <= parseFloat(maxPrice));
      }
      
      if (minCommission !== null) {
        filteredProducts = filteredProducts.filter(p => p.commissionRate >= parseFloat(minCommission));
      }

      if (minDiscount !== null) {
        filteredProducts = filteredProducts.filter(p => {
          const discount = ((p.originalPrice - p.price) / p.originalPrice) * 100;
          return discount >= parseFloat(minDiscount);
        });
      }

      if (minRating !== null) {
        filteredProducts = filteredProducts.filter(p => p.ratingStar >= parseFloat(minRating));
      }

      // Ordenação
      switch(sortBy) {
        case 'sales':
          filteredProducts.sort((a, b) => b.sales - a.sales);
          break;
        case 'commission':
          filteredProducts.sort((a, b) => b.commissionRate - a.commissionRate);
          break;
        case 'price':
          filteredProducts.sort((a, b) => a.price - b.price);
          break;
        case 'discount':
          filteredProducts.sort((a, b) => {
            const discountA = ((a.originalPrice - a.price) / a.originalPrice) * 100;
            const discountB = ((b.originalPrice - b.price) / b.originalPrice) * 100;
            return discountB - discountA;
          });
          break;
        case 'rating':
          filteredProducts.sort((a, b) => b.ratingStar - a.ratingStar);
          break;
      }

      // Paginação
      const offset = (parseInt(page) - 1) * parseInt(limit);
      const paginatedProducts = filteredProducts.slice(offset, offset + parseInt(limit));
      console.log('Final filtered and paginated products:', paginatedProducts.length);
      
      const response = {
        success: true,
        data: {
          products: paginatedProducts,
          totalCount: filteredProducts.length,
          page: parseInt(page),
          limit: parseInt(limit),
          hasMore: offset + paginatedProducts.length < filteredProducts.length
        }
      };
      console.log('Sending response:', JSON.stringify(response, null, 2));
      res.status(200).json(response);
    } catch (error) {
      console.error('Error in getProducts:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getSpecialProducts(req, res) {
    console.log('GET /api/special-products called');
    try {
      const products = ShopeeService.getProductsFromJson();
      console.log('Total products available:', products.length);
      const { limit = 12, type = 'discount', categoryId = null, minRating = null } = req.query;
      
      let filteredProducts = [...products];
      console.log('Initial products count:', filteredProducts.length);
      
      if (categoryId) {
        filteredProducts = filteredProducts.filter(p => p.category_id === categoryId);
        console.log('After category filter:', filteredProducts.length);
      }

      if (minRating !== null) {
        filteredProducts = filteredProducts.filter(p => p.ratingStar >= parseFloat(minRating));
        console.log('After rating filter:', filteredProducts.length);
      }

      // Ordenação baseada no tipo
      switch(type) {
        case 'discount':
          filteredProducts.sort((a, b) => {
            const discountA = ((a.originalPrice - a.price) / a.originalPrice) * 100;
            const discountB = ((b.originalPrice - b.price) / b.originalPrice) * 100;
            return discountB - discountA;
          });
          break;
        case 'rating':
          filteredProducts.sort((a, b) => b.ratingStar - a.ratingStar);
          break;
        case 'sales':
          filteredProducts.sort((a, b) => b.sales - a.sales);
          break;
      }

      // Limitar resultados
      filteredProducts = filteredProducts.slice(0, parseInt(limit));
      console.log('Final filtered products:', filteredProducts.length);

      const response = {
        success: true,
        data: {
          products: filteredProducts,
          totalCount: filteredProducts.length
        }
      };
      console.log('Sending response:', JSON.stringify(response, null, 2));
      res.status(200).json(response);
    } catch (error) {
      console.error('Error in getSpecialProducts:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching special products',
        error: error.toString()
      });
    }
  }
}

module.exports = new ProductsController();
