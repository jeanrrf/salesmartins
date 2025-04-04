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
        minCommission = null
      } = req.query;
      
      const offset = (parseInt(page) - 1) * parseInt(limit);
      
      let query = 'SELECT * FROM products WHERE 1=1';
      const params = [];
      
      if (category && category !== 'all') {
        query += ' AND category_id = ?';
        params.push(category);
      }
      
      if (search) {
        query += ' AND name LIKE ?';
        params.push(`%${search}%`);
      }
      
      if (minPrice !== null) {
        query += ' AND price >= ?';
        params.push(parseFloat(minPrice));
      }
      
      if (maxPrice !== null) {
        query += ' AND price <= ?';
        params.push(parseFloat(maxPrice));
      }
      
      if (minCommission !== null) {
        query += ' AND commission_rate >= ?';
        params.push(parseFloat(minCommission) / 100);
      }
      
      switch(sortBy) {
        case 'sales':
          query += ' ORDER BY sales DESC';
          break;
        case 'commission':
          query += ' ORDER BY commission_rate DESC';
          break;
        case 'price':
          query += ' ORDER BY price ASC';
          break;
        case 'newest':
          query += ' ORDER BY created_at DESC';
          break;
        case 'discount':
          query += ' ORDER BY ((original_price - price) / original_price) DESC';
          break;
        case 'rating':
          query += ' ORDER BY rating_star DESC';
          break;
        default:
          query += ' ORDER BY sales DESC';
      }
      
      query += ' LIMIT ? OFFSET ?';
      params.push(parseInt(limit), offset);
      
      const [products] = await pool.promise().query(query, params);
      
      let countQuery = 'SELECT COUNT(*) as total FROM products WHERE 1=1';
      const countParams = [...params.slice(0, -2)];
      
      if (category && category !== 'all') {
        countQuery += ' AND category_id = ?';
      }
      
      if (search) {
        countQuery += ' AND name LIKE ?';
      }
      
      if (minPrice !== null) {
        countQuery += ' AND price >= ?';
      }
      
      if (maxPrice !== null) {
        countQuery += ' AND price <= ?';
      }
      
      if (minCommission !== null) {
        countQuery += ' AND commission_rate >= ?';
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
          rating_star: product.rating_star,
          rating_count: product.rating_count || '1k',
          free_shipping: Boolean(product.free_shipping),
          createdAt: product.created_at,
          discount_percentage: product.original_price && product.price 
            ? Math.round((1 - product.price / product.original_price) * 100) 
            : 0,
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
          AND p.original_price > 0 
          AND p.price > 0
          AND ((p.original_price - p.price) / p.original_price) * 100 >= ?
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

      console.log('Executing query:', query);
      console.log('With parameters:', params);

      const [products] = await pool.promise().query(query, params);
      console.log(`Found ${products.length} special products`);

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
        rating_star: product.rating_star,
        rating_count: product.rating_count || '1k',
        free_shipping: Boolean(product.free_shipping),
        discount_percentage: product.discount_percentage,
        tags: [], // Empty array for now since we don't have tags table
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
