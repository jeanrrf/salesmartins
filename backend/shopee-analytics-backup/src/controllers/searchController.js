const shopeeService = require('../services/shopeeService');
const { pool } = require('../config/database');

class SearchController {
    async searchProducts(req, res) {
        try {
            const { 
                keyword,
                categoryId,
                minPrice,
                maxPrice,
                minCommission,
                sortBy = 'popular',
                limit = 20, 
                page = 1,
                excludeExisting = false,
                hotProductsOnly = false
            } = req.query;
            
            if ((!keyword || keyword.trim().length < 2) && !categoryId) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Palavra-chave de busca ou categoria é obrigatória'
                });
            }
            
            // Preparar parâmetros para a API da Shopee
            const searchParams = {
                keyword: keyword?.trim(),
                categoryId,
                minPrice: minPrice ? parseFloat(minPrice) : undefined,
                maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
                minCommission: minCommission ? parseFloat(minCommission) / 100 : undefined,
                sortBy,
                limit: parseInt(limit),
                page: parseInt(page),
                hotProductsOnly: hotProductsOnly === 'true'
            };
            
            // Buscar produtos na API Shopee
            const searchResults = await shopeeService.searchProducts(searchParams);
            
            // Se foi solicitado para excluir produtos existentes, filtrar os resultados
            if (excludeExisting === 'true' && req.user?.id) {
                const userId = req.user.id;
                
                // Obter IDs de produtos que o usuário já tem links
                const [existingProducts] = await pool.promise().query(
                    `SELECT product_details FROM affiliate_links WHERE user_id = ?`,
                    [userId]
                );
                
                const existingProductIds = new Set();
                
                // Extrair IDs de produtos dos detalhes do produto salvos
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
                
                // Filtrar produtos que não estão na lista de existentes
                if (searchResults.data && searchResults.data.products) {
                    searchResults.data.products = searchResults.data.products.filter(product => 
                        !existingProductIds.has(product.itemId.toString())
                    );
                }
            }
            
            res.status(200).json(searchResults);
        } catch (error) {
            res.status(500).json({ 
                success: false, 
                message: 'Erro ao buscar produtos', 
                error: error.message 
            });
        }
    }
    
    async getTrendingProducts(req, res) {
        try {
            const { 
                keywords,
                categoryIds,
                minSales = 50,
                limit = 20,
                excludeExisting = false
            } = req.body;
            
            // Validar os parâmetros
            if ((!keywords || !Array.isArray(keywords) || keywords.length === 0) && 
                (!categoryIds || !Array.isArray(categoryIds) || categoryIds.length === 0)) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Palavras-chave ou categorias são obrigatórias' 
                });
            }
            
            // Buscar produtos em alta
            const trendingProducts = await shopeeService.getTrendingProducts({
                keywords,
                categoryIds,
                minSales: parseInt(minSales),
                limit: parseInt(limit)
            });
            
            // Se foi solicitado para excluir produtos existentes, filtrar os resultados
            if (excludeExisting && req.user?.id) {
                const userId = req.user.id;
                
                // Obter IDs de produtos que o usuário já tem links
                const [existingProducts] = await pool.promise().query(
                    `SELECT product_details FROM affiliate_links WHERE user_id = ?`,
                    [userId]
                );
                
                const existingProductIds = new Set();
                
                // Extrair IDs de produtos dos detalhes do produto salvos
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
                
                // Filtrar produtos que não estão na lista de existentes
                if (trendingProducts.data && trendingProducts.data.products) {
                    trendingProducts.data.products = trendingProducts.data.products.filter(product => 
                        !existingProductIds.has(product.itemId.toString())
                    );
                }
            }
            
            res.status(200).json(trendingProducts);
        } catch (error) {
            res.status(500).json({ 
                success: false, 
                message: 'Erro ao buscar produtos em alta', 
                error: error.message 
            });
        }
    }

    async getRecommendedProducts(req, res) {
        try {
            const { productId, limit = 8 } = req.query;
            
            if (!productId) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'ID do produto é obrigatório' 
                });
            }
            
            // Buscar produtos recomendados
            const recommendedProducts = await shopeeService.getRecommendedProducts(
                productId,
                parseInt(limit)
            );
            
            res.status(200).json(recommendedProducts);
        } catch (error) {
            res.status(500).json({ 
                success: false, 
                message: 'Erro ao buscar produtos recomendados', 
                error: error.message 
            });
        }
    }
}

module.exports = new SearchController();