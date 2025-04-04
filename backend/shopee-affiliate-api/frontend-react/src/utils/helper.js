/**
 * Formata um valor numérico como moeda (R$)
 * @param {Number} value - Valor a ser formatado
 * @returns {String} - Valor formatado como moeda
 */
export const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    }).format(value);
  };
  
  /**
   * Formata um número como percentual
   * @param {Number} value - Valor a ser formatado
   * @param {Number} decimals - Casas decimais (padrão: 2)
   * @returns {String} - Valor formatado como percentual
   */
  export const formatPercent = (value, decimals = 2) => {
    return `${value.toFixed(decimals)}%`;
  };
  
  /**
   * Trunca um texto para o número especificado de caracteres
   * @param {String} text - Texto a ser truncado
   * @param {Number} maxLength - Tamanho máximo (padrão: 100)
   * @returns {String} - Texto truncado com reticências se necessário
   */
  export const truncateText = (text, maxLength = 100) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };
  
  /**
   * Transforma uma string em slug para URLs amigáveis
   * @param {String} text - Texto para transformar em slug
   * @returns {String} - Texto transformado em slug
   */
  export const slugify = (text) => {
    return text
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '')
      .replace(/--+/g, '-');
  };
  
  /**
   * Gera uma URL para compartilhamento
   * @param {String} productId - ID do produto
   * @param {String} affiliateId - ID do afiliado
   * @returns {String} - URL formatada para o produto
   */
  export const generateAffiliateLink = (productId, affiliateId) => {
    return `https://shopee.com.br/product/${productId}?referral_id=${affiliateId}`;
  };
  
  /**
   * Copia um texto para a área de transferência
   * @param {String} text - Texto a ser copiado
   * @returns {Promise<Boolean>} - Sucesso ou falha da operação
   */
  export const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.error('Falha ao copiar texto:', err);
      return false;
    }
  };
  
  /**
   * Obtém a cor da tendência com base no valor
   * @param {Number} value - Valor da tendência
   * @returns {String} - Nome da classe CSS de cor
   */
  export const getTrendColor = (value) => {
    if (value > 0) return 'trend-up';
    if (value < 0) return 'trend-down';
    return 'trend-neutral';
  };
  
  /**
   * Obtém o ícone de tendência com base no valor
   * @param {Number} value - Valor da tendência
   * @returns {String} - Símbolo de tendência
   */
  export const getTrendIcon = (value) => {
    if (value > 0) return '↑';
    if (value < 0) return '↓';
    return '→';
  };
  
  /**
   * Formata uma data para exibição localizada
   * @param {String|Date} date - Data a ser formatada
   * @param {String} format - Formato desejado ('short', 'long', 'full')
   * @returns {String} - Data formatada
   */
  export const formatDate = (date, format = 'short') => {
    if (!date) return '';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    const options = {
      short: { day: '2-digit', month: '2-digit', year: 'numeric' },
      long: { day: '2-digit', month: 'long', year: 'numeric' },
      full: { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }
    };
    
    return dateObj.toLocaleDateString('pt-BR', options[format]);
  };
  
  /**
   * Calcula a diferença percentual entre dois valores
   * @param {Number} current - Valor atual
   * @param {Number} previous - Valor anterior
   * @returns {Number} - Diferença percentual
   */
  export const calculatePercentageDifference = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };
  
  /**
   * Remove caracteres especiais de uma string
   * @param {String} text - Texto para limpar
   * @returns {String} - Texto sem caracteres especiais
   */
  export const removeSpecialChars = (text) => {
    return text.replace(/[^\w\s]/gi, '');
  };
  
  /**
   * Obtém apenas o domínio de uma URL
   * @param {String} url - URL completa
   * @returns {String} - Apenas o domínio
   */
  export const getDomainFromUrl = (url) => {
    try {
      const domain = new URL(url);
      return domain.hostname;
    } catch (error) {
      return url;
    }
  };
  
  /**
   * Gera uma cor hexadecimal aleatória
   * @returns {String} - Cor em formato hexadecimal
   */
  export const getRandomColor = () => {
    return `#${Math.floor(Math.random() * 16777215).toString(16)}`;
  };
  
  /**
   * Gera um ID único
   * @returns {String} - ID único
   */
  export const generateUniqueId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  };
  
  /**
   * Converte objeto em parâmetros de URL
   * @param {Object} params - Objeto com parâmetros
   * @returns {String} - String formatada para URL
   */
  export const objectToQueryString = (params) => {
    return Object.keys(params)
      .filter(key => params[key] !== undefined && params[key] !== null && params[key] !== '')
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
      .join('&');
  };