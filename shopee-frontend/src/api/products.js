import axios from 'axios';
import config from '../config';

// Create an axios instance with default config
const api = axios.create({
  baseURL: config.API_BASE_URL,
  timeout: config.API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Log API responses for debugging
const logResponse = (endpoint, response) => {
  console.log(`API ${endpoint} response:`, response);
  return response;
};

// Fetch products with filters
export const fetchProducts = async (searchQuery = '', filters = {}) => {
  console.log('Fetching products with query:', searchQuery, 'and filters:', filters);
  try {
    const response = await api.get('/products', {
      params: {
        query: searchQuery,
        ...filters,
      },
    });

    logResponse('/products', response);

    if (response.data && Array.isArray(response.data.data)) {
      return response.data.data;
    } else {
      console.warn('Unexpected API response format:', response.data);
      return [];
    }
  } catch (error) {
    console.error('API request failed:', error.message || error);
    throw error;
  }
};

// Search products - dedicated endpoint for search
export const searchProducts = async (query, filters) => {
  try {
    const response = await api.get('/products/search', {
      params: {
        query,
        ...filters,
      },
    });
    logResponse('/products/search', response);
    return response.data.data || [];
  } catch (error) {
    console.error('API request failed:', error.message || error);
    throw error;
  }
};

// Get product details
export const getProductDetails = async (productId) => {
  try {
    const response = await api.get(`/products/${productId}`);
    logResponse(`/products/${productId}`, response);
    return response.data;
  } catch (error) {
    console.error('API request failed:', error.message || error);
    throw error;
  }
};

// Get products by category
export const getProductsByCategory = async (categoryId) => {
  try {
    const response = await api.get(`/products/category/${categoryId}`);
    logResponse(`/products/category/${categoryId}`, response);
    return response.data.data || [];
  } catch (error) {
    console.error('API request failed:', error.message || error);
    throw error;
  }
};