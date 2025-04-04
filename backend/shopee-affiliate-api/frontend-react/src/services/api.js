import axios from 'axios';

// Cria uma instância do axios com configurações base
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api', // Certifique-se de que a baseURL está correta
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true // Importante para CORS com credenciais
});

// Interceptor para incluir o token de autenticação em todas as requisições
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para tratamento de erros nas respostas
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const currentToken = localStorage.getItem('token');
        if (!currentToken) {
          window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
          return Promise.reject(error);
        }
        const renewResponse = await axios.post(
          `${api.defaults.baseURL}/auth/renew`,
          {},
          {
            headers: {
              'Authorization': `Bearer ${currentToken}`,
              'Content-Type': 'application/json'
            }
          }
        );
        if (renewResponse.data.token) {
          localStorage.setItem('token', renewResponse.data.token);
          if (renewResponse.data.user) {
            localStorage.setItem('user', JSON.stringify(renewResponse.data.user));
          }
          api.defaults.headers.common['Authorization'] = `Bearer ${renewResponse.data.token}`;
          originalRequest.headers['Authorization'] = `Bearer ${renewResponse.data.token}`;
          return api(originalRequest);
        }
        throw error;
      } catch (refreshError) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

// Serviços de autenticação
export const authService = {
  login: (credentials) => api.post('/auth/login', credentials), // Verifique se a rota '/auth/login' existe no backend
  register: (userData) => api.post('/auth/register', userData), // Verifique se a rota '/auth/register' existe no backend
  validateToken: () => api.get('/auth/validate'), // Verifique se a rota '/auth/validate' existe no backend
  renewToken: () => api.post('/auth/renew'), // Verifique se a rota '/auth/renew' existe no backend
  updateProfile: (profileData) => api.put('/auth/profile', profileData), // Verifique se a rota '/auth/profile' existe no backend
};

// Serviços para links de afiliados
export const affiliateService = {
  createLink: (linkData) => api.post('/affiliate/link', linkData), // Verifique se a rota '/affiliate/link' existe no backend
  getLinks: () => api.get('/affiliate/links'), // Verifique se a rota '/affiliate/links' existe no backend
  getLinkById: (id) => api.get(`/affiliate/link/${id}`), // Verifique se a rota '/affiliate/link/:id' existe no backend
  deleteLink: (id) => api.delete(`/affiliate/link/${id}`), // Verifique se a rota '/affiliate/link/:id' existe no backend
  searchProducts: (searchParams) => api.get('/affiliate/search', { params: searchParams }), // Verifique se a rota '/affiliate/search' existe no backend
  getCategories: () => api.get('/categories'), // Verifique se a rota '/categories' existe no backend
  getProductsByCategory: (categoryId, params) => api.get(`/affiliate/category/${categoryId}/products`, { params }), // Verifique se a rota '/affiliate/category/:categoryId/products' existe no backend
  trackClick: (linkId) => api.post(`/affiliate/link/${linkId}/track`), // Verifique se a rota '/affiliate/link/:linkId/track' existe no backend
  recordConversion: (linkId, conversionData) => api.post(`/affiliate/link/${linkId}/conversion`, conversionData), // Verifique se a rota '/affiliate/link/:linkId/conversion' existe no backend
  getDatabaseProducts: (params) => {
    // If we have a specific categoryId, use the category-specific endpoint
    if (params && params.categoryId && params.categoryId !== 'all') {
      return api.get(`/affiliate/category/${params.categoryId}/products`, { 
        params: {
          ...params,
          categoryId: undefined // Remove categoryId as it's already in the URL
        }
      });
    }
    
    // For all categories or no category specified
    return api.get('/products', { params });
  },
  
  // Novo método para buscar produtos com filtros específicos
  getSpecialProducts: (params = {}) => {
    return api.get('/products/special', { params });
  },
  
  // Método para obter produtos em promoção
  getDiscountProducts: (limit = 4, minDiscount = 20) => {
    return api.get('/products/special', { 
      params: {
        limit,
        sortBy: 'discount',
        minDiscount
      }
    });
  },
  
  // Método para obter produtos bem avaliados
  getTopRatedProducts: (limit = 4, minRating = 4.5) => {
    return api.get('/products/special', { 
      params: {
        limit,
        sortBy: 'rating',
        minRating
      }
    });
  },
};

// Serviços para estatísticas
export const statsService = {
  getStats: () => api.get('/stats'),
  getUserStats: () => api.get('/stats/user'),
  getStatsByDateRange: (params) => api.get('/stats/date-range', { params }),
  getLinkStats: (linkId) => api.get(`/stats/link/${linkId}`),
  getDashboardStats: () => api.get('/stats/dashboard'),
};

// Serviços para configurações
export const settingsService = {
  getUserSettings: () => api.get('/settings'),
  updateUserSettings: (settings) => api.put('/settings', settings),
  validateAffiliateId: (affiliateId) => api.post('/settings/validate-affiliate', { affiliateId }),
  getNotificationPreferences: () => api.get('/settings/notifications'),
};

export default api;