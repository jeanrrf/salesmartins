import axios from 'axios';
import { getToken } from './auth';

// Use real API URL
const API_URL = 'https://api.sentinnell.com/api';

// Setup default headers with authentication
const getAuthHeaders = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Fetch products from the real API
 * @param {Object} params Query parameters
 * @returns {Promise} Promise resolving to product data
 */
export const getProducts = async (params = {}) => {
  try {
    const response = await axios.get(`${API_URL}/products`, {
      params,
      headers: {
        ...getAuthHeaders()
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

/**
 * Get product details by ID from real API
 * @param {string|number} id Product ID
 * @returns {Promise} Promise resolving to product detail
 */
export const getProductDetails = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/products/${id}`, {
      headers: {
        ...getAuthHeaders()
      }
    });

    return response.data;
  } catch (error) {
    console.error(`Error fetching product ${id}:`, error);
    throw error;
  }
};

/**
 * Get all categories from real API
 * @returns {Promise} Promise resolving to categories data
 */
export const getCategories = async () => {
  try {
    const response = await axios.get(`${API_URL}/categories`, {
      headers: {
        ...getAuthHeaders()
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};