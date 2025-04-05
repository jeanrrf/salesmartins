const shopeeConfig = {
    BASE_URL: process.env.NODE_ENV === 'production' 
        ? process.env.API_BASE_URL 
        : 'http://localhost:3001',
        
    ENDPOINTS: {
        GET_PRODUCTS: '/api/products',
        GET_SPECIAL_PRODUCTS: '/api/products/special',
        GET_CATEGORY_PRODUCTS: '/api/affiliate/category'
    }
};

module.exports = shopeeConfig;