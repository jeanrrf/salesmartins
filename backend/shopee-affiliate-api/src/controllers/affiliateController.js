const linkGeneratorService = require('../services/linkGeneratorService');
const shopeeService = require('../services/shopeeService');
const Stats = require('../models/stats');
const { pool } = require('../config/database');
const AffiliateLink = require('../models/affiliateLink');

class AffiliateController {
    async createAffiliateLink(req, res) {
        try {
            const { productId } = req.body;
            const userId = req.user.id;
            
            if (!productId) {
                return res.status(400).json({ success: false, message: 'ID do produto é obrigatório' });
            }
            
            const options = {
                campaignId: req.body.campaignId,
                subId: req.body.subId
            };
            
            const affiliateLink = await linkGeneratorService.createAffiliateLink(userId, productId, options);
            res.status(201).json({ success: true, data: affiliateLink });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    
    async bulkCreateAffiliateLinks(req, res) {
        try {
            const { products } = req.body;
            const userId = req.user.id;
            
            if (!products || !Array.isArray(products) || products.length === 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Lista de produtos é obrigatória e deve ser um array não vazio' 
                });
            }
            
            const options = {
                campaignId: req.body.campaignId,
                subId: req.body.subId
            };
            
            const result = await linkGeneratorService.bulkCreateAffiliateLinks(userId, products, options);
            res.status(201).json({ success: true, data: result });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    
    async generateSequentialLinks(req, res) {
        try {
            const { products } = req.body;
            const userId = req.user.id;
            
            if (!products || !Array.isArray(products) || products.length === 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Lista de produtos é obrigatória e deve ser um array não vazio' 
                });
            }
            
            const options = {
                campaignId: req.body.campaignId || 'seq',
                startingSequence: req.body.startingSequence || 1
            };
            
            const result = await linkGeneratorService.generateSequentialLinks(userId, products, options);
            res.status(201).json({ success: true, data: result });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    
    async getAffiliateLinks(req, res) {
        try {
            const userId = req.user.id;
            const links = await linkGeneratorService.getAffiliateLinks(userId);
            res.status(200).json({ success: true, data: links });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    
    async getAffiliateLinkById(req, res) {
        try {
            const { id } = req.params;
            const link = await linkGeneratorService.getAffiliateLinkById(id);
            
            if (link.userId.toString() !== req.user.id && req.user.role !== 'admin') {
                return res.status(403).json({ success: false, message: 'Não autorizado a visualizar este link' });
            }
            
            res.status(200).json({ success: true, data: link });
        } catch (error) {
            res.status(404).json({ success: false, message: error.message });
        }
    }
    
    async updateAffiliateLink(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            const updateData = {
                name: req.body.name,
                affiliateUrl: req.body.affiliateUrl
            };
            
            const updatedLink = await linkGeneratorService.updateAffiliateLink(id, userId, updateData);
            res.status(200).json({ success: true, data: updatedLink });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
    
    async deleteAffiliateLink(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            
            const result = await linkGeneratorService.deleteAffiliateLink(id, userId);
            res.status(200).json({ success: true, ...result });
        } catch (error) {
            res.status(404).json({ success: false, message: error.message });
        }
    }
    
    async searchProducts(req, res) {
        try {
            const { keyword, limit = 10, page = 1, excludeExisting = false } = req.query;
            
            if (!keyword || keyword.trim().length < 3) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Palavra-chave de busca deve ter pelo menos 3 caracteres'
                });
            }
            
            const searchResults = await shopeeService.searchProducts(keyword, parseInt(limit), parseInt(page));
            
            if (excludeExisting === 'true') {
                const userId = req.user.id;
                
                const [existingProducts] = await pool.promise().query(
                    `SELECT product_details FROM affiliate_links WHERE user_id = ?`,
                    [userId]
                );
                
                const existingProductIds = new Set();
                
                existingProducts.forEach(item => {
                    if (item.product_details) {
                        try {
                            const details = JSON.parse(item.product_details);
                            if (details.itemId) {
                                existingProductIds.add(details.itemId.toString());
                            }
                        } catch (e) {
                            console.error('Erro ao analisar detalhes do produto:', e);
                        }
                    }
                });
                
                if (searchResults.data && searchResults.data.products) {
                    searchResults.data.products = searchResults.data.products.filter(product => 
                        !existingProductIds.has(product.itemId.toString())
                    );
                }
            }
            
            res.status(200).json(searchResults);
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    
    async getProductCategories(req, res) {
        try {
            console.log('Fetching categories...');
            const categories = await shopeeService.getProductCategories();
            console.log('Categories fetched:', categories);
            res.status(200).json(categories);
        } catch (error) {
            console.error('Error fetching categories:', error);
            res.status(500).json({ success: false, message: 'Erro ao buscar categorias.' });
        }
    }

    getCategoryIcon(categoryName) {
        if (!categoryName) return '🛍️';
        
        const name = categoryName.toLowerCase();
        if (name.includes('eletrônico')) return '📱';
        if (name.includes('moda')) return '👕';
        if (name.includes('casa')) return '🏠';
        if (name.includes('beleza')) return '💄';
        if (name.includes('esporte')) return '⚽';
        if (name.includes('brinquedo')) return '🎮';
        if (name.includes('livro')) return '📚';
        if (name.includes('saúde')) return '💊';
        if (name.includes('automotivo')) return '🚗';
        if (name.includes('pet')) return '🐱';
        return '🛍️';
    }
    
    async getProductsByCategory(req, res) {
        try {
            const { categoryId } = req.params;
            const { limit = 12, page = 1, search } = req.query;
            
            if (!categoryId) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Category ID is required' 
                });
            }
            
            let query = `
                SELECT * FROM products 
                WHERE category_id = ?
            `;
            
            const queryParams = [categoryId];
            
            if (search) {
                query += ` AND name LIKE ?`;
                queryParams.push(`%${search}%`);
            }
            
            query += ` LIMIT ? OFFSET ?`;
            const pageInt = parseInt(page);
            const limitInt = parseInt(limit);
            const offset = (pageInt - 1) * limitInt;
            queryParams.push(limitInt, offset);
            
            let countQuery = `
                SELECT COUNT(*) as total FROM products 
                WHERE category_id = ?
            `;
            
            const countParams = [categoryId];
            
            if (search) {
                countQuery += ` AND name LIKE ?`;
                countParams.push(`%${search}%`);
            }
            
            const [products] = await pool.promise().query(query, queryParams);
            const [totalResults] = await pool.promise().query(countQuery, countParams);
            const totalCount = totalResults[0].total;
            
            const formattedProducts = products.map(product => ({
                id: product.id,
                itemId: product.item_id || product.id,
                name: product.name,
                price: product.price,
                originalPrice: product.original_price,
                image: product.image_url,
                categoryId: product.category_id,
                categoryName: product.category_name,
                commissionRate: product.commission_rate,
                sales: product.sales,
                affiliateUrl: product.affiliate_link || `https://shope.ee/product/${product.item_id || product.id}`
            }));
            
            res.status(200).json({
                success: true,
                data: {
                    products: formattedProducts,
                    categoryInfo: {
                        id: categoryId,
                        name: products[0]?.category_name || 'Category'
                    },
                    totalCount,
                    page: pageInt,
                    limit: limitInt,
                    hasMore: offset + products.length < totalCount
                }
            });
        } catch (error) {
            console.error('Error fetching products by category:', error);
            res.status(500).json({ 
                success: false, 
                message: error.message 
            });
        }
    }
    
    async trackAffiliateClick(req, res) {
        try {
            const { linkId } = req.params;
            const userId = req.user.id;
            
            await shopeeService.trackAffiliateClick(linkId, userId);
            await Stats.recordClick(linkId);
            
            res.status(200).json({ success: true, message: 'Clique registrado com sucesso' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    
    async recordConversion(req, res) {
        try {
            const { linkId } = req.params;
            const { orderId, orderValue } = req.body;
            
            if (!orderId || !orderValue) {
                return res.status(400).json({
                    success: false,
                    message: 'ID do pedido e valor do pedido são obrigatórios'
                });
            }
            
            const link = await linkGeneratorService.getAffiliateLinkById(linkId);
            
            if (!link) {
                return res.status(404).json({
                    success: false,
                    message: 'Link de afiliado não encontrado'
                });
            }
            
            await Stats.recordConversion(linkId, parseFloat(orderValue));
            await shopeeService.recordConversion(linkId, orderId, parseFloat(orderValue));
            
            res.status(200).json({
                success: true,
                message: 'Conversão registrada com sucesso',
                data: {
                    linkId,
                    orderId,
                    orderValue: parseFloat(orderValue)
                }
            });
            
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async saveProductsToDatabase(req, res) {
        try {
            const { products } = req.body;
            const userId = req.user.id;
            
            if (!products || !Array.isArray(products) || products.length === 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Lista de produtos é obrigatória e deve ser um array não vazio' 
                });
            }

            const results = {
                success: true,
                totalProcessed: products.length,
                successCount: 0,
                errorCount: 0,
                savedProducts: []
            };

            const connection = await pool.promise().getConnection();
            
            try {
                await connection.beginTransaction();
                
                for (const product of products) {
                    try {
                        const [existingProducts] = await connection.query(
                            'SELECT id FROM products WHERE item_id = ?',
                            [product.itemId || product.id]
                        );
                        
                        if (existingProducts.length > 0) {
                            await connection.query(
                                `UPDATE products SET 
                                name = ?, 
                                price = ?, 
                                original_price = ?, 
                                image_url = ?, 
                                category_id = ?, 
                                category_name = ?,
                                commission_rate = ?,
                                rating_star = ?,
                                sales = ?,
                                shop_id = ?,
                                shop_name = ?,
                                updated_at = CURRENT_TIMESTAMP
                                WHERE item_id = ?`,
                                [
                                    product.name || product.productName,
                                    product.price || product.priceMin,
                                    product.originalPrice || product.priceMax,
                                    product.image || product.imageUrl,
                                    product.categoryId,
                                    product.categoryName,
                                    product.commissionRate,
                                    product.ratingStar,
                                    product.sales,
                                    product.shopId,
                                    product.shopName,
                                    product.itemId || product.id
                                ]
                            );
                            
                            results.successCount++;
                            results.savedProducts.push({
                                ...product,
                                id: existingProducts[0].id,
                                updated: true
                            });
                        } else {
                            const [result] = await connection.query(
                                `INSERT INTO products 
                                (item_id, name, price, original_price, image_url, category_id, category_name, 
                                commission_rate, rating_star, sales, shop_id, shop_name, created_by)
                                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                                [
                                    product.itemId || product.id,
                                    product.name || product.productName,
                                    product.price || product.priceMin,
                                    product.originalPrice || product.priceMax,
                                    product.image || product.imageUrl,
                                    product.categoryId,
                                    product.categoryName,
                                    product.commissionRate,
                                    product.ratingStar,
                                    product.sales,
                                    product.shopId,
                                    product.shopName,
                                    userId
                                ]
                            );
                            
                            results.successCount++;
                            results.savedProducts.push({
                                ...product,
                                id: result.insertId,
                                created: true
                            });
                        }
                    } catch (productError) {
                        results.errorCount++;
                        console.error(`Erro ao processar produto ${product.itemId || product.id}:`, productError);
                    }
                }
                
                await connection.commit();
            } catch (dbError) {
                await connection.rollback();
                throw dbError;
            } finally {
                connection.release();
            }
            
            res.status(201).json({ success: true, data: results });
        } catch (error) {
            console.error('Erro ao salvar produtos no banco de dados:', error);
            res.status(500).json({ 
                success: false, 
                message: `Erro ao salvar produtos: ${error.message}` 
            });
        }
    }

    async getProductsWithCategoryIssues(req, res) {
        try {
            const [products] = await pool.promise().query(`
                SELECT * FROM products 
                WHERE (category_id IS NULL OR category_id = '' OR category_name IS NULL OR category_name = '')
                AND repaired = 0
                ORDER BY created_at DESC
            `);
            
            res.status(200).json(products);
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async updateProductCategory(req, res) {
        try {
            const { productId } = req.params;
            const { categoryId, categoryName } = req.body;
            
            if (!categoryId) {
                return res.status(400).json({ success: false, message: 'ID da categoria é obrigatório' });
            }
            
            let finalCategoryName = categoryName;
            if (!finalCategoryName) {
                const categoriesResult = await shopeeService.getProductCategories();
                const categories = categoriesResult.data || [];
                const category = categories.find(cat => cat.id === categoryId);
                finalCategoryName = category ? category.name : `Categoria ${categoryId}`;
            }
            
            const [result] = await pool.promise().query(
                'UPDATE products SET category_id = ?, category_name = ? WHERE id = ?',
                [categoryId, finalCategoryName, productId]
            );
            
            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, message: 'Produto não encontrado' });
            }
            
            res.status(200).json({ 
                success: true, 
                message: 'Categoria do produto atualizada com sucesso',
                data: {
                    productId,
                    categoryId,
                    categoryName: finalCategoryName
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async repairProductCategories(req, res) {
        try {
            const { id } = req.params;
            const { categoryId, categoryName } = req.body;

            if (!id || !categoryId) {
                return res.status(400).json({ success: false, message: 'ID do produto e ID da categoria são obrigatórios' });
            }

            let finalCategoryName = categoryName;
            if (!finalCategoryName) {
                const categoriesResult = await shopeeService.getProductCategories();
                const categories = categoriesResult.data || [];
                const category = categories.find(cat => cat.id === categoryId);
                finalCategoryName = category ? category.name : `Categoria ${categoryId}`;
            }

            const [result] = await pool.promise().query(
                'UPDATE products SET category_id = ?, category_name = ? WHERE id = ?',
                [categoryId, finalCategoryName, id]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, message: 'Produto não encontrado' });
            }

            res.status(200).json({ 
                success: true, 
                message: 'Categoria do produto atualizada com sucesso',
                data: {
                    productId: id,
                    categoryId,
                    categoryName: finalCategoryName
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async saveRepairLogs(req, res) {
        try {
            const { repairedItems } = req.body;
            
            if (!repairedItems || !Array.isArray(repairedItems)) {
                return res.status(400).json({ success: false, message: 'Lista de itens reparados é obrigatória' });
            }
            
            res.status(200).json({ 
                success: true, 
                message: 'Logs de reparo salvos com sucesso',
                count: repairedItems.length
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async getRepairLogs(req, res) {
        try {
            res.status(200).json({
                success: true,
                repairedItems: []
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async getDatabaseProducts(req, res) {
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
                    originalPrice: product.original_price,
                    image: product.image_url,
                    categoryId: product.category_id,
                    categoryName: product.category_name,
                    commissionRate: product.commission_rate,
                    sales: product.sales,
                    createdAt: product.created_at,
                    affiliateUrl: affiliateUrl
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
            console.error('Error fetching products from database:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async getUncategorizedProducts(req, res) {
        try {
            const [products] = await pool.promise().query(`
                SELECT id, name, item_id, category_id
                FROM products
                WHERE (category_id IS NULL OR category_id = '' OR category_name IS NULL OR category_name = '')
                LIMIT 50
            `);
            
            console.log(`Found ${products.length} uncategorized products`);
            
            res.status(200).json({ 
                success: true, 
                data: products,
                count: products.length
            });
        } catch (error) {
            console.error('Error fetching uncategorized products:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Error fetching uncategorized products', 
                error: error.message 
            });
        }
    }

    async updateProductCategories(req, res) {
        try {
            const { products } = req.body;
            console.log('Received data for update:', JSON.stringify(products, null, 2));

            if (!products || !Array.isArray(products)) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Products list is required and must be an array' 
                });
            }

            const connection = await pool.promise().getConnection();
            try {
                await connection.beginTransaction();

                const [categories] = await connection.query(`
                    SELECT id, name FROM categories
                `);
                
                const categoryMap = {};
                categories.forEach(cat => {
                    categoryMap[cat.id] = cat.name;
                });

                for (const product of products) {
                    if (!product.id) {
                        console.error('Product ID not provided:', product);
                        continue;
                    }
                    
                    const categoryId = product.categoryId || '';
                    let categoryName = product.categoryName || '';
                    
                    if (!categoryName && categoryId && categoryMap[categoryId]) {
                        categoryName = categoryMap[categoryId];
                    }

                    console.log(`Updating product ${product.id} with category:`, {
                        id: categoryId,
                        name: categoryName
                    });

                    await connection.query(`
                        UPDATE products
                        SET category_id = ?, category_name = ?
                        WHERE id = ?
                    `, [categoryId, categoryName, product.id]);
                }

                await connection.commit();
                res.status(200).json({ success: true, message: 'Categories updated successfully' });
            } catch (error) {
                console.error('Transaction error:', error);
                await connection.rollback();
                throw error;
            } finally {
                connection.release();
            }
        } catch (error) {
            console.error('Error updating categories:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Error updating categories', 
                error: error.message
            });
        }
    }

    async getSpecialProducts(req, res) {
        try {
            const { 
                limit = 12, 
                sortBy = 'discount',
                minPrice = null,
                maxPrice = null,
                minCommission = null
            } = req.query;
            
            let query = 'SELECT * FROM products WHERE 1=1';
            const params = [];
            
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
            
            // Add condition to ensure we only get products with discounts
            query += ' AND original_price > price';
            
            switch(sortBy) {
                case 'discount':
                    query += ' ORDER BY ((original_price - price) / original_price) DESC';
                    break;
                case 'commission':
                    query += ' ORDER BY commission_rate DESC';
                    break;
                case 'price':
                    query += ' ORDER BY price ASC';
                    break;
                case 'sales':
                    query += ' ORDER BY sales DESC';
                    break;
                default:
                    query += ' ORDER BY ((original_price - price) / original_price) DESC';
            }
            
            query += ' LIMIT ?';
            params.push(parseInt(limit));
            
            const [products] = await pool.promise().query(query, params);
            
            const productsWithLinks = products.map(product => ({
                id: product.id,
                itemId: product.item_id || product.id,
                name: product.name,
                price: product.price,
                originalPrice: product.original_price,
                image: product.image_url,
                categoryId: product.category_id,
                categoryName: product.category_name,
                commissionRate: product.commission_rate,
                sales: product.sales,
                createdAt: product.created_at,
                affiliateUrl: product.affiliate_link || `https://shope.ee/product/${product.item_id || product.id}`,
                discountPercentage: Math.round(((product.original_price - product.price) / product.original_price) * 100)
            }));
            
            res.status(200).json({
                success: true,
                data: {
                    products: productsWithLinks,
                    totalCount: products.length
                }
            });
        } catch (error) {
            console.error('Error fetching special products:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = new AffiliateController();