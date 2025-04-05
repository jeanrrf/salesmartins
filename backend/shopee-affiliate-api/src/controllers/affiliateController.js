const { products, getProductsByCategory } = require('../data/products');

class AffiliateController {
    async getDatabaseProducts(req, res) {
        try {
            const { 
                page = 1, 
                limit = 12,
                search = null,
                sortBy = 'sales'
            } = req.query;

            let filteredProducts = [...products];
            
            if (search) {
                const searchLower = search.toLowerCase();
                filteredProducts = filteredProducts.filter(p => 
                    p.name.toLowerCase().includes(searchLower));
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
                case 'rating':
                    filteredProducts.sort((a, b) => b.ratingStar - a.ratingStar);
                    break;
            }

            // Paginação
            const offset = (parseInt(page) - 1) * parseInt(limit);
            const paginatedProducts = filteredProducts.slice(offset, offset + parseInt(limit));

            // Formatar produtos com URLs de afiliado
            const productsWithLinks = paginatedProducts.map(product => ({
                ...product,
                affiliateUrl: `https://shope.ee/product/${product.itemId}`
            }));
            
            res.status(200).json({
                success: true,
                data: {
                    products: productsWithLinks,
                    totalCount: filteredProducts.length,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    hasMore: offset + paginatedProducts.length < filteredProducts.length
                }
            });
        } catch (error) {
            console.error('Error fetching products from database:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async getProductsByCategory(req, res) {
        try {
            const { categoryId } = req.params;
            const { page = 1, limit = 12, search = null } = req.query;

            let categoryProducts = getProductsByCategory(categoryId);
            
            if (search) {
                const searchLower = search.toLowerCase();
                categoryProducts = categoryProducts.filter(p => 
                    p.name.toLowerCase().includes(searchLower));
            }

            // Paginação
            const offset = (parseInt(page) - 1) * parseInt(limit);
            const paginatedProducts = categoryProducts.slice(offset, offset + parseInt(limit));

            // Adicionar URLs de afiliado
            const productsWithLinks = paginatedProducts.map(product => ({
                ...product,
                affiliateUrl: `https://shope.ee/product/${product.itemId}`
            }));

            res.status(200).json({
                success: true,
                data: {
                    products: productsWithLinks,
                    totalCount: categoryProducts.length,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    hasMore: offset + paginatedProducts.length < categoryProducts.length
                }
            });
        } catch (error) {
            console.error('Error fetching products by category:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async getSpecialProducts(req, res) {
        try {
            const { limit = 12, type = 'discount' } = req.query;
            
            let filteredProducts = [...products];

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

            // Adicionar URLs de afiliado
            const productsWithLinks = filteredProducts.map(product => ({
                ...product,
                affiliateUrl: `https://shope.ee/product/${product.itemId}`
            }));

            res.status(200).json({
                success: true,
                data: {
                    products: productsWithLinks,
                    totalCount: productsWithLinks.length
                }
            });
        } catch (error) {
            console.error('Error fetching special products:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = new AffiliateController();