/**
 * Utilitário para validação de URLs da API
 */
class UrlValidator {
  /**
   * Valida se uma URL está corretamente formatada
   */
  static isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Normaliza uma URL para garantir formato consistente
   */
  static normalizeUrl(baseUrl, path) {
    // Remover barras duplicadas
    const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    
    return `${cleanBaseUrl}${cleanPath}`;
  }

  /**
   * Verifica se um endpoint existe no mapa de rotas conhecidas
   */
  static isKnownEndpoint(endpoint, knownRoutes) {
    return knownRoutes.some(route => {
      // Suporta rotas com parâmetros como /products/:id
      const routePattern = route.replace(/:\w+/g, '[^/]+');
      const regex = new RegExp(`^${routePattern}$`);
      return regex.test(endpoint);
    });
  }
}

module.exports = UrlValidator;
