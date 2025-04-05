import axios from 'axios';

// Cria uma instância do axios com configurações base
const api = axios.create({
  // Use relative path instead of absolute URL
  baseURL: '/api',
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
    console.error('API Error:', {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      url: error.config?.url,
      method: error.config?.method,
      data: error.config?.data,
    });

    const originalRequest = error.config;

    // Handle 401 Unauthorized errors
    if (error.response?.status === 401 && !originalRequest._retry) {
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

    // Handle 500 Internal Server Error
    if (error.response?.status === 500) {
      return Promise.reject({
        status: 500,
        message: error.response.data?.message || 'Erro interno do servidor',
        details: error.response.data
      });
    }

    // Handle network errors
    if (error.code === 'ERR_NETWORK') {
      return Promise.reject({
        status: 0,
        message: 'Erro de conexão. Verifique sua internet.',
      });
    }

    // Handle timeout
    if (error.code === 'ECONNABORTED') {
      return Promise.reject({
        status: 408,
        message: 'A requisição excedeu o tempo limite.',
      });
    }

    return Promise.reject({
      status: error.response?.status || 0,
      message: error.message || 'Erro desconhecido',
      details: error.response?.data
    });
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
  getCategories: () => api.get('/products', { params: { categoryOnly: true } }), // Usar a rota de produtos para obter categorias
  getProductsByCategory: (categoryId, params) => api.get(`/affiliate/category/${categoryId}/products`, { params }), // Verifique se a rota '/affiliate/category/:categoryId/products' existe no backend
  trackClick: (linkId) => api.post(`/affiliate/link/${linkId}/track`), // Verifique se a rota '/affiliate/link/:linkId/track' existe no backend
  recordConversion: (linkId, conversionData) => api.post(`/affiliate/link/${linkId}/conversion`, conversionData), // Verifique se a rota '/affiliate/link/:linkId/conversion' existe no backend
  getSpecialProducts: (params) => api.get('/affiliate/products/special', { params }),
  getDatabaseProducts: (params) => api.get('/affiliate/products', { params })
};

// Serviços para produtos
export const productsService = {
  getAll: (params) => api.get('/products', { params }),
  getSpecial: (params) => api.get('/products/special', { params }),
  getCategories: () => api.get('/categories'),
  getByCategory: (categoryId, params) => api.get(`/category/${categoryId}/products`, { params })
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