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

// Fallback to mock data if API fails
const handleApiError = async (error, mockDataPath) => {
  console.error('API request failed:', error);

  if (config.USE_MOCK_DATA) {
    try {
      const mockResponse = await axios.get(`${config.FALLBACK_API_URL}/${mockDataPath}`);
      console.log('Using mock data:', mockResponse.data);
      // Extract the array from the data property if it exists
      return mockResponse.data.data || [];
    } catch (mockError) {
      console.error('Failed to load mock data:', mockError);
      throw error; // Re-throw the original error if mock data fails
    }
  } else {
    throw error;
  }
};

// Fetch products with filters
export const fetchProducts = async (filters = {}) => {
  try {
    const response = await api.get('/products', {
      params: filters,
    });
    // Extract the array from the data property if it exists
    return response.data.data || [];
  } catch (error) {
    return handleApiError(error, 'products.json');
  }
};

// Other API functions remain the same
export const searchProducts = async (query, filters) => {
  try {
    const response = await api.get('/products/search', {
      params: {
        query,
        ...filters,
      },
    });
    // Extract the array from the data property if it exists
    return response.data.data || [];
  } catch (error) {
    return handleApiError(error, 'products.json');
  }
};

export const getProductDetails = async (productId) => {
  try {
    const response = await api.get(`/products/${productId}`);
    return response.data;
  } catch (error) {
    return handleApiError(error, 'product_details.json');
  }
};

export const getProductsByCategory = async (categoryId) => {
  try {
    const response = await api.get(`/products/category/${categoryId}`);
    // Extract the array from the data property if it exists
    return response.data.data || [];
  } catch (error) {
    return handleApiError(error, 'products.json');
  }
};