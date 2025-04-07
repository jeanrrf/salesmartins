import axios from 'axios';

const API_BASE_URL = 'https://api.shopee.com'; // Replace with the actual Shopee API base URL

export const fetchProducts = async (filters = {}) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/products`, {
            params: filters,
        });
        return response.data;
    } catch (error) {
        throw new Error('Error fetching products: ' + error.message);
    }
};

export const searchProducts = async (query, filters) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/products/search`, {
            params: {
                query,
                ...filters,
            },
        });
        return response.data;
    } catch (error) {
        throw new Error('Error fetching products: ' + error.message);
    }
};

export const getProductDetails = async (productId) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/products/${productId}`);
        return response.data;
    } catch (error) {
        throw new Error('Error fetching product details: ' + error.message);
    }
};

export const getProductsByCategory = async (categoryId) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/products/category/${categoryId}`);
        return response.data;
    } catch (error) {
        throw new Error('Error fetching products by category: ' + error.message);
    }
};