const axios = require('axios');

const apiHelper = {
    generateAffiliateUrl(productId) {
        return `https://shope.ee/product/${productId}`;
    },

    formatProductData(product) {
        return {
            ...product,
            affiliateUrl: this.generateAffiliateUrl(product.itemId)
        };
    }
};

module.exports = apiHelper;