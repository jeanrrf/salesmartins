const shopeeConfig = {
    API_KEY: process.env.SHOPEE_API_KEY,
    API_SECRET: process.env.SHOPEE_API_SECRET,
    BASE_URL: 'https://partner.shopeemobile.com/api/v1',
    
    // Axios configuration
    axiosConfig: {
        baseURL: process.env.NODE_ENV === 'production' 
            ? process.env.API_BASE_URL 
            : 'http://localhost:3001',
        timeout: 10000,
        withCredentials: true,
        headers: {
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json'
        },
        transitional: {
            silentJSONParsing: true,
            forcedJSONParsing: true,
            clarifyTimeoutError: false
        },
        xsrfCookieName: 'XSRF-TOKEN',
        xsrfHeaderName: 'X-XSRF-TOKEN',
        maxContentLength: -1,
        maxBodyLength: -1
    },

    ENDPOINTS: {
        GET_PRODUCT: '/product/get',
        CREATE_AFFILIATE_LINK: '/affiliate/link/create',
        GET_AFFILIATE_LINKS: '/affiliate/link/get',
        GET_STATS: '/affiliate/stats/get',
    },
};

module.exports = shopeeConfig;