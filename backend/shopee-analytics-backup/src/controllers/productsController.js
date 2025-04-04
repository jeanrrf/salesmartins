const { pool } = require('../config/database');

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
      
      const offset = (parseInt(page) - 1) * parseInt(limit);
      
      let query = `
        SELECT 
          p.*,
          CASE 
            WHEN p.original_price > 0 AND p.price > 0 
            THEN ROUND((1 - p.price / p.original_price) * 100)
            ELSE 0
          END as discount_percentage
        FROM products p 
        WHERE 1=1`;
      const params = [];
      
      if (category && category !== 'all') {
        query += ' AND p.category_id = ?';
        params.push(category);
      }
      
      if (search) {
        query += ' AND p.name LIKE ?';
        params.push(`%${search}%`);
      }
      
      if (minPrice !== null) {
        query += ' AND p.price >= ?';
        params.push(parseFloat(minPrice));
      }
      
      if (maxPrice !== null) {
        query += ' AND p.price <= ?';
        params.push(parseFloat(maxPrice));
      }
      
      if (minCommission !== null) {
        query += ' AND p.commission_rate >= ?';
        params.push(parseFloat(minCommission) / 100);
      }

      if (minDiscount !== null) {
        query += ' AND p.original_price > p.price AND ((p.original_price - p.price) / p.original_price * 100) >= ?';
        params.push(parseFloat(minDiscount));
      }

      if (minRating !== null) {
        query += ' AND p.rating_star >= ?';
        params.push(parseFloat(minRating));
      }
      
      switch(sortBy) {
        case 'sales':
          query += ' ORDER BY p.sales DESC';
          break;
        case 'commission':
          query += ' ORDER BY p.commission_rate DESC';
          break;
        case 'price':
          query += ' ORDER BY p.price ASC';
          break;
        case 'newest':
          query += ' ORDER BY p.created_at DESC';
          break;
        case 'discount':
          query += ' ORDER BY discount_percentage DESC';
          break;
        case 'rating':
          query += ' ORDER BY p.rating_star DESC, p.sales DESC';
          break;
        default:
          query += ' ORDER BY p.sales DESC';
      }
      
      query += ' LIMIT ? OFFSET ?';
      params.push(parseInt(limit), offset);
      
      const [products] = await pool.promise().query(query, params);
      
      let countQuery = 'SELECT COUNT(*) as total FROM products p WHERE 1=1';
      const countParams = [...params.slice(0, -2)];
      
      if (category && category !== 'all') {
        countQuery += ' AND p.category_id = ?';
      }
      
      if (search) {
        countQuery += ' AND p.name LIKE ?';
      }
      
      if (minPrice !== null) {
        countQuery += ' AND p.price >= ?';
      }
      
      if (maxPrice !== null) {
        countQuery += ' AND p.price <= ?';
      }
      
      if (minCommission !== null) {
        countQuery += ' AND p.commission_rate >= ?';
      }

      if (minDiscount !== null) {
        countQuery += ' AND p.original_price > p.price AND ((p.original_price - p.price) / p.original_price * 100) >= ?';
      }

      if (minRating !== null) {
        countQuery += ' AND p.rating_star >= ?';
      }
      
      const [totalResults] = await pool.promise().query(countQuery, countParams);
      const totalProducts = totalResults[0].total;
      
      const productsWithLinks = products.map(product => {
        const affiliateUrl = product.affiliate_link || `https://shope.ee/product/${product.item_id || product.id}`;
        
        return {
          id: product.id,
          itemId: product.item_id || product.id,
          name: product.name,
          price: product.price,
          original_price: product.original_price,
          image_url: product.image_url,
          categoryId: product.category_id,
          categoryName: product.category_name,
          commission_rate: product.commission_rate,
          sales: product.sales,
          rating_star: parseFloat(product.rating_star) || 0,
          rating_count: product.rating_count || '1k',
          free_shipping: Boolean(product.free_shipping),
          createdAt: product.created_at,
          discount_percentage: product.discount_percentage,
          affiliateUrl: affiliateUrl,
          tags: product.tags ? JSON.parse(product.tags) : []
        };
      });

      res.status(200).json({
        success: true,
        data: {
          products: productsWithLinks,
          totalCount: totalProducts,
          page: parseInt(page),
          limit: parseInt(limit),
          hasMore: offset + products.length < totalProducts
        }
      });
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getSpecialProducts(req, res) {
    try {
      const {
        limit = 4,
        sortBy = 'discount',
        minDiscount = 0,
        minRating = 0,
        categoryId = null
      } = req.query;

      let query = `
        SELECT 
          p.*, 
          CASE 
            WHEN p.original_price > 0 AND p.price > 0 
            THEN ROUND((1 - p.price / p.original_price) * 100)
            ELSE 0
          END as discount_percentage
        FROM products p
        WHERE 1=1
      `;

      const params = [];

      if (minDiscount > 0) {
        query += ` 
          AND p.original_price > p.price 
          AND ((p.original_price - p.price) / p.original_price * 100) >= ?
        `;
        params.push(parseFloat(minDiscount));
      }

      if (minRating > 0) {
        query += ` AND p.rating_star >= ?`;
        params.push(parseFloat(minRating));
      }

      if (categoryId) {
        query += ` AND p.category_id = ?`;
        params.push(categoryId);
      }

      switch(sortBy) {
        case 'discount':
          query += ` ORDER BY discount_percentage DESC`;
          break;
        case 'rating':
          query += ` ORDER BY p.rating_star DESC, p.sales DESC`;
          break;
        case 'sales':
          query += ` ORDER BY p.sales DESC`;
          break;
        case 'price':
          query += ` ORDER BY p.price ASC`;
          break;
        case 'newest':
          query += ` ORDER BY p.created_at DESC`;
          break;
        default:
          query += ` ORDER BY discount_percentage DESC`;
      }

      query += ` LIMIT ?`;
      params.push(parseInt(limit));

      const [products] = await pool.promise().query(query, params);

      if (!Array.isArray(products)) {
        throw new Error('Expected products to be an array, got: ' + typeof products);
      }

      const productsWithLinks = products.map(product => ({
        id: product.id,
        itemId: product.item_id || product.id,
        name: product.name,
        price: product.price,
        original_price: product.original_price,
        image_url: product.image_url,
        categoryId: product.category_id,
        categoryName: product.category_name,
        commission_rate: product.commission_rate,
        sales: product.sales,
        rating_star: parseFloat(product.rating_star) || 0,
        rating_count: product.rating_count || '1k',
        free_shipping: Boolean(product.free_shipping),
        discount_percentage: product.discount_percentage,
        tags: product.tags ? JSON.parse(product.tags) : [],
        affiliateUrl: product.affiliate_link || `https://shope.ee/product/${product.item_id || product.id}`
      }));

      res.status(200).json({
        success: true,
        data: {
          products: productsWithLinks,
          totalCount: products.length
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
