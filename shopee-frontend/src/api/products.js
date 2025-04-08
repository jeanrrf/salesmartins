import axios from 'axios';
import axiosRetry from 'axios-retry';
import config from '../config';

// Criar instância do axios com configurações otimizadas
const api = axios.create({
  baseURL: config.API_BASE_URL,
  timeout: config.API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Configurar retries automáticos para resiliência
axiosRetry(api, {
  retries: config.MAX_RETRIES,
  retryDelay: (retryCount) => {
    return config.RETRY_DELAY * Math.pow(2, retryCount - 1);
  },
  retryCondition: (error) => {
    return axiosRetry.isNetworkOrIdempotentRequestError(error) ||
      (error.response && error.response.status >= 500);
  }
});

// Adicionar interceptor para melhor tratamento de erros
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      console.error(`Erro API (${error.response.status}):`, error.response.data);
      return Promise.reject(error);
    } else if (error.request) {
      console.error('Erro de conexão:', error.message);
      return Promise.reject(new Error('Erro de conexão. Verifique sua internet.'));
    } else {
      console.error('Erro na configuração da requisição:', error.message);
      return Promise.reject(new Error('Erro na requisição. Tente novamente.'));
    }
  }
);

// Buscar produtos com filtros
export const fetchProducts = async (searchQuery = '', filters = {}) => {
  console.log('Buscando produtos com query:', searchQuery, 'e filtros:', filters);

  try {
    const response = await api.get('/api/products', {
      params: {
        query: searchQuery,
        ...filters,
      },
    });

    if (response.data && Array.isArray(response.data.data)) {
      return response.data.data;
    } else {
      console.warn('Formato inesperado de resposta da API:', response.data);
      throw new Error('Formato de resposta inválido');
    }
  } catch (error) {
    console.error('Falha na requisição à API:', error.message || error);
    throw error;
  }
};

// Buscar produtos específicos
export const searchProducts = async (query, filters) => {
  try {
    const response = await api.get('/api/products/search', {
      params: {
        query,
        ...filters,
      },
    });

    if (response.data && Array.isArray(response.data.data)) {
      return response.data.data;
    } else {
      throw new Error('Formato de resposta inválido');
    }
  } catch (error) {
    console.error('Falha na busca de produtos:', error.message || error);
    throw error;
  }
};

// Obter detalhes de um produto
export const getProductDetails = async (productId) => {
  try {
    const response = await api.get(`/api/products/${productId}`);
    return response.data;
  } catch (error) {
    console.error('Falha ao obter detalhes do produto:', error.message || error);
    throw error;
  }
};

// Obter produtos por categoria
export const getProductsByCategory = async (categoryId) => {
  try {
    const response = await api.get(`/api/products/category/${categoryId}`);

    if (response.data && Array.isArray(response.data.data)) {
      return response.data.data;
    } else {
      throw new Error('Formato de resposta inválido');
    }
  } catch (error) {
    console.error('Falha ao obter produtos por categoria:', error.message || error);
    throw error;
  }
};

export default {
  fetchProducts,
  searchProducts,
  getProductDetails,
  getProductsByCategory
};