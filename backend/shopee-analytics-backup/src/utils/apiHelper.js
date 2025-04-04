const axios = require('axios');
const { SHOPEE_API_URL, SHOPEE_API_KEY } = require('../config/shopeeConfig');

const apiHelper = {
    async makeApiRequest(endpoint, method = 'GET', data = null) {
        try {
            const response = await axios({
                method,
                url: `${SHOPEE_API_URL}/${endpoint}`,
                headers: {
                    'Authorization': `Bearer ${SHOPEE_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                data,
            });
            return response.data;
        } catch (error) {
            throw new Error(`API request failed: ${error.message}`);
        }
    },

    async getAffiliateLink(productId, userId) {
        const endpoint = `affiliate/link`;
        const data = { productId, userId };
        return await this.makeApiRequest(endpoint, 'POST', data);
    },

    async getProductDetails(productId) {
        const endpoint = `products/${productId}`;
        return await this.makeApiRequest(endpoint);
    },
};

module.exports = apiHelper;