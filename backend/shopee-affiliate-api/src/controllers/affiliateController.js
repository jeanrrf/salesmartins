const ShopeeService = require('../services/shopeeService');
const Product = require('../models/Product'); // Certifique-se de que este modelo exista

class AffiliateController {
    async getDatabaseProducts(req, res) {
        try {
            const { 
                page = 1, 
                limit = 12,
                search = null,
                sortBy = 'sales'
            } = req.query;

            const searchParams = {
                keyword: search,
                limit: parseInt(limit),
                page: parseInt(page),
                sortBy
            };
            
            const result = await ShopeeService.searchProducts(searchParams);
            
            // Formatar produtos com URLs de afiliado
            if (result.data && result.data.products) {
                result.data.products = result.data.products.map(product => ({
                    ...product,
                    affiliateUrl: product.affiliate_link || `https://shope.ee/product/${product.shopee_id || product.id}`
                }));
            }
            
            res.status(200).json(result);
        } catch (error) {
            console.error('Error fetching products from database:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async getProductsByCategory(req, res) {
        try {
            const { categoryId } = req.params;
            const { page = 1, limit = 12, search = null } = req.query;

            const searchParams = {
                categoryId,
                keyword: search,
                limit: parseInt(limit),
                page: parseInt(page)
            };
            
            const result = await ShopeeService.searchProducts(searchParams);
            
            // Adicionar URLs de afiliado
            if (result.data && result.data.products) {
                result.data.products = result.data.products.map(product => ({
                    ...product,
                    affiliateUrl: product.affiliate_link || `https://shope.ee/product/${product.shopee_id || product.id}`
                }));
            }

            res.status(200).json(result);
        } catch (error) {
            console.error('Error fetching products by category:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async getSpecialProducts(req, res) {
        try {
            const { limit = 12, type = 'discount' } = req.query;
            
            const searchParams = {
                limit: parseInt(limit),
                sortBy: type
            };
            
            const result = await ShopeeService.searchProducts(searchParams);
            
            // Adicionar URLs de afiliado
            if (result.data && result.data.products) {
                result.data.products = result.data.products.map(product => ({
                    ...product,
                    affiliateUrl: product.affiliate_link || `https://shope.ee/product/${product.shopee_id || product.id}`
                }));
            }

            res.status(200).json(result);
        } catch (error) {
            console.error('Error fetching special products:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async getCategories(req, res) {
        try {
            const result = await ShopeeService.getProductCategories();
            
            if (result && result.success && result.data) {
                res.status(200).json({ 
                    success: true, 
                    data: result.data 
                });
            } else {
                // Caso não consiga obter categorias da API, tenta do banco de dados
                const categories = await Product.aggregate([
                    { $group: { _id: "$category_id", name: { $first: "$category_name" } } },
                    { $sort: { name: 1 } }
                ]);

                const formattedCategories = categories.map(category => ({
                    category_id: category._id,
                    category_name: category.name || category._id
                }));

                res.status(200).json({ 
                    success: true, 
                    data: formattedCategories 
                });
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to fetch categories',
                error: error.message 
            });
        }
    }

    async searchProducts(req, res) {
        res.status(501).json({ message: "Not implemented yet" });
    }

    async createAffiliateLink(req, res) {
        res.status(501).json({ message: "Not implemented yet" });
    }

    async getAffiliateLinks(req, res) {
        res.status(501).json({ message: "Not implemented yet" });
    }

    async getAffiliateLinkById(req, res) {
        res.status(501).json({ message: "Not implemented yet" });
    }

    async deleteAffiliateLink(req, res) {
        res.status(501).json({ message: "Not implemented yet" });
    }
}

module.exports = new AffiliateController();