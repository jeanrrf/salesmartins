const shopeeConfig = {
    API_KEY: process.env.SHOPEE_API_KEY,
    API_SECRET: process.env.SHOPEE_API_SECRET,
    BASE_URL: 'https://partner.shopeemobile.com/api/v1',
    ENDPOINTS: {
        GET_PRODUCT: '/product/get',
        CREATE_AFFILIATE_LINK: '/affiliate/link/create',
        GET_AFFILIATE_LINKS: '/affiliate/link/get',
        GET_STATS: '/affiliate/stats/get',
    },
};

module.exports = shopeeConfig;