import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import axiosRetry from 'axios-retry';
import config from '../config';

// Create a more resilient axios instance with retry capability
const createApiClient = (timeout = config.API_TIMEOUT) => {
    const instance = axios.create({
        timeout,
        headers: { 'Content-Type': 'application/json' }
    });

    // Configurar retry para tentativas automáticas em caso de falha
    axiosRetry(instance, {
        retries: config.MAX_RETRIES,
        retryDelay: (retryCount) => {
            return config.RETRY_DELAY * Math.pow(2, retryCount - 1);
        },
        retryCondition: (error) => {
            // Retry on network errors or 5xx server errors
            return axiosRetry.isNetworkOrIdempotentRequestError(error) ||
                (error.response && error.response.status >= 500);
        }
    });

    // Add request interceptor for better tracking
    instance.interceptors.request.use(config => {
        config.metadata = { startTime: new Date() };
        return config;
    }, error => {
        return Promise.reject(error);
    });

    // Add response interceptor for logging
    instance.interceptors.response.use(response => {
        const duration = new Date() - response.config.metadata.startTime;
        console.log(`API request to ${response.config.url} completed in ${duration}ms`);
        return response;
    }, error => {
        if (error.response) {
            console.error('API Error:', error.response.status, error.response.data);
        } else if (error.request) {
            console.error('API Connection Error:', error.message);
        } else {
            console.error('API Request Error:', error.message);
        }
        return Promise.reject(error);
    });

    return instance;
};

// Helper function to validate image URLs
const validateImageUrl = (url) => {
    if (!url) return false;
    return url.startsWith('http://') || url.startsWith('https://');
};

export const useProducts = (initialSearchQuery = '', initialFilters = {}) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
    const [filters, setFilters] = useState(initialFilters);
    const [dataSource, setDataSource] = useState('loading');

    // Use a ref to track component mount state
    const isMounted = useRef(true);

    // Clean up on unmount
    useEffect(() => {
        return () => {
            isMounted.current = false;
        };
    }, []);

    // Formatar dados de produtos
    const formatProducts = (rawProducts) => {
        return rawProducts.map(product => ({
            ...product,
            imageUrl: validateImageUrl(product.imageUrl) ? product.imageUrl : null
        }));
    };

    const fetchProducts = useCallback(async (query = searchQuery, customFilters = filters) => {
        if (!isMounted.current) return;

        setLoading(true);
        setError(null);
        setDataSource('loading');

        // Cache key para armazenamento em cache
        const cacheKey = `products_${query || ""}_${JSON.stringify(customFilters)}`;

        // Verificar cache se habilitado
        if (config.USE_CACHE) {
            try {
                const cached = sessionStorage.getItem(cacheKey);
                if (cached) {
                    const { data, timestamp } = JSON.parse(cached);
                    // Usar cache apenas se for recente
                    if (Date.now() - timestamp < config.CACHE_DURATION) {
                        if (isMounted.current) {
                            setProducts(data);
                            setDataSource('api');
                            setLoading(false);
                        }
                        return data;
                    }
                }
            } catch (err) {
                console.warn('Erro ao recuperar cache:', err.message);
            }
        }

        try {
            console.log('Buscando produtos da API com query:', query, 'e filtros:', customFilters);
            const apiClient = createApiClient();

            // Tentar usar API GraphQL primeiro (se configurado)
            if (config.USE_SHOPEE_API) {
                try {
                    const graphqlRequest = {
                        query: `
                        query searchProducts($keyword: String!, $sortType: Int, $limit: Int, $page: Int) {
                            productOfferV2(keyword: $keyword, sortType: $sortType, limit: $limit, page: $page) {
                                nodes {
                                    itemId
                                    productName
                                    commissionRate
                                    sales
                                    priceMin
                                    priceMax
                                    imageUrl
                                    shopName
                                    productLink
                                    offerLink
                                }
                                pageInfo {
                                    page
                                    limit
                                    hasNextPage
                                }
                            }
                        }`,
                        variables: {
                            keyword: query || "popular",
                            sortType: 2, // Sort by popularity
                            limit: 20,
                            page: 1,
                            minSales: customFilters.minSales || 0,
                            maxCommission: customFilters.maxCommission || 100,
                            similarityThreshold: customFilters.similarityThreshold || 0
                        }
                    };

                    const response = await apiClient.post(config.GRAPHQL_ENDPOINT, graphqlRequest);

                    if (response.data?.data?.productOfferV2?.nodes) {
                        const formattedProducts = response.data.data.productOfferV2.nodes.map(product => ({
                            id: product.itemId,
                            name: product.productName,
                            price: product.priceMin,
                            imageUrl: validateImageUrl(product.imageUrl) ? product.imageUrl : null,
                            sales: product.sales || 0,
                            commission: product.commissionRate || 0,
                            shopName: product.shopName,
                            productUrl: product.productLink,
                            affiliateLink: product.offerLink
                        }));

                        // Cache se habilitado
                        if (config.USE_CACHE) {
                            try {
                                sessionStorage.setItem(cacheKey, JSON.stringify({
                                    data: formattedProducts,
                                    timestamp: Date.now()
                                }));
                            } catch (err) {
                                console.warn('Erro ao salvar cache:', err.message);
                            }
                        }

                        if (isMounted.current) {
                            setProducts(formattedProducts);
                            setDataSource('api');
                            setLoading(false);
                            setError(null);
                        }
                        return formattedProducts;
                    }
                } catch (graphqlError) {
                    console.error("Erro na API GraphQL, tentando API REST:", graphqlError.message);
                }
            }

            // Tentativa com API REST local
            const queryParams = { query };

            // Adicionar apenas parâmetros com valores reais
            if (customFilters.minSales !== undefined && customFilters.minSales !== '') {
                queryParams.minSales = customFilters.minSales;
            }

            if (customFilters.maxCommission !== undefined && customFilters.maxCommission !== '') {
                queryParams.maxCommission = customFilters.maxCommission;
            }

            if (customFilters.similarityThreshold !== undefined && customFilters.similarityThreshold !== '') {
                queryParams.similarityThreshold = customFilters.similarityThreshold;
            }

            const restResponse = await apiClient.get(`${config.API_BASE_URL}/api/products`, {
                params: queryParams
            });

            if (restResponse.data && Array.isArray(restResponse.data.data)) {
                const processedProducts = formatProducts(restResponse.data.data);

                // Cache se habilitado
                if (config.USE_CACHE) {
                    try {
                        sessionStorage.setItem(cacheKey, JSON.stringify({
                            data: processedProducts,
                            timestamp: Date.now()
                        }));
                    } catch (err) {
                        console.warn('Erro ao salvar cache:', err.message);
                    }
                }

                if (isMounted.current) {
                    setProducts(processedProducts);
                    setDataSource('api');
                    setLoading(false);
                    setError(null);
                }
                return processedProducts;
            } else {
                throw new Error('Formato de resposta inválido da API');
            }
        } catch (err) {
            console.error('Erro ao buscar produtos:', err);
            if (isMounted.current) {
                setError(`Falha ao buscar produtos: ${err.message || 'Erro desconhecido'}`);
                setDataSource('error');
                setLoading(false);
                setProducts([]);
            }
            throw err;
        }
    }, [searchQuery, filters]);

    // Buscar produtos ao montar ou quando dependências mudarem
    useEffect(() => {
        fetchProducts().catch(err => {
            console.error("Erro na busca inicial de produtos:", err);
        });

        return () => {
            isMounted.current = false;
        };
    }, [fetchProducts]);

    return {
        products,
        loading,
        error,
        fetchProducts,
        searchQuery,
        setSearchQuery,
        filters,
        setFilters,
        dataSource
    };
};

export default useProducts;