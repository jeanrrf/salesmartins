const { products } = require('../data/products');

class ProductsController {
  async getProducts(req, res) {
    try {
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
      
      // Aplicar filtros
      if (category && category !== 'all') {
        filteredProducts = filteredProducts.filter(p => p.categoryId === category);
      }
      
      if (search) {
        const searchLower = search.toLowerCase();
        filteredProducts = filteredProducts.filter(p => 
          p.name.toLowerCase().includes(searchLower));
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
      
      res.status(200).json({
        success: true,
        data: {
          products: paginatedProducts,
          totalCount: filteredProducts.length,
          page: parseInt(page),
          limit: parseInt(limit),
          hasMore: offset + paginatedProducts.length < filteredProducts.length
        }
      });
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getSpecialProducts(req, res) {
    try {
      const { limit = 12, type = 'discount', categoryId = null, minRating = null } = req.query;
      
      let filteredProducts = [...products];
      
      if (categoryId) {
        filteredProducts = filteredProducts.filter(p => p.categoryId === categoryId);
      }

      if (minRating !== null) {
        filteredProducts = filteredProducts.filter(p => p.ratingStar >= parseFloat(minRating));
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

      res.status(200).json({
        success: true,
        data: {
          products: filteredProducts,
          totalCount: filteredProducts.length
        }
      });
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
