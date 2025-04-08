import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import axiosRetry from 'axios-retry';
import config from '../config';

// Criar instância axios resiliente
const createApiClient = (timeout = config.API_TIMEOUT) => {
    const instance = axios.create({
        timeout,
        headers: { 'Content-Type': 'application/json' }
    });

    axiosRetry(instance, {
        retries: config.MAX_RETRIES,
        retryDelay: (retryCount) => config.RETRY_DELAY * Math.pow(2, retryCount - 1),
        retryCondition: error => axiosRetry.isNetworkOrIdempotentRequestError(error) ||
            (error.response && error.response.status >= 500)
    });

    return instance;
};

export const ProductContext = createContext();

export const ProductProvider = ({ children }) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filterOptions, setFilterOptions] = useState({
        minSales: 0,
        maxCommission: 100,
        similarityThreshold: 0,
    });
    const [dataSource, setDataSource] = useState('loading');
    const [retryAttempt, setRetryAttempt] = useState(0);

    // Controlar estado de montagem
    const isMounted = useRef(true);

    // Limpar na desmontagem
    useEffect(() => {
        return () => {
            isMounted.current = false;
        };
    }, []);

    // Processar dados de produtos
    const processProductData = (productsData) => {
        return productsData.map(product => ({
            ...product,
            // Garantir URLs de imagem válidas
            imageUrl: product.imageUrl && product.imageUrl.startsWith('http')
                ? product.imageUrl
                : null
        }));
    };

    // Buscar produtos com retry automático
    const fetchProducts = useCallback(async (customFilters) => {
        if (!isMounted.current) return;

        setLoading(true);
        setError(null);
        const filtersToUse = customFilters || filterOptions;
        console.log('Buscando produtos com filtros:', filtersToUse);

        // Cache key
        const cacheKey = `products_context_${JSON.stringify(filtersToUse)}`;

        // Verificar cache se habilitado
        if (config.USE_CACHE) {
            try {
                const cached = sessionStorage.getItem(cacheKey);
                if (cached) {
                    const { data, timestamp } = JSON.parse(cached);
                    // Usar cache apenas se for recente
                    if (Date.now() - timestamp < config.CACHE_DURATION) {
                        if (isMounted.current) {
                            setProducts(processProductData(data));
                            setDataSource('api');
                            setLoading(false);
                            setError(null);
                        }
                        return data;
                    }
                }
            } catch (err) {
                console.warn('Erro ao recuperar cache:', err.message);
            }
        }

        try {
            // Tentar GraphQL API primeiro
            if (config.USE_SHOPEE_API) {
                try {
                    const apiClient = createApiClient();

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
                            keyword: "popular",
                            sortType: 2, // Por popularidade
                            limit: 20,
                            page: 1,
                            minSales: filtersToUse.minSales || 0,
                            maxCommission: filtersToUse.maxCommission || 100,
                            similarityThreshold: filtersToUse.similarityThreshold || 0
                        }
                    };

                    const response = await apiClient.post(
                        config.GRAPHQL_ENDPOINT,
                        graphqlRequest
                    );

                    if (response.data?.data?.productOfferV2?.nodes) {
                        const formattedProducts = response.data.data.productOfferV2.nodes.map(product => ({
                            id: product.itemId,
                            name: product.productName,
                            price: product.priceMin,
                            imageUrl: product.imageUrl,
                            sales: product.sales || 0,
                            commission: product.commissionRate || 0,
                            shopName: product.shopName,
                            productUrl: product.productLink,
                            affiliateLink: product.offerLink
                        }));

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
                            setProducts(processProductData(formattedProducts));
                            setError(null);
                            setDataSource('api');
                            setLoading(false);
                            setRetryAttempt(0);
                        }
                        return;
                    }
                } catch (graphqlError) {
                    console.error("Erro na API GraphQL, tentando API REST:", graphqlError.message);
                }
            }

            // Tentar API REST local
            try {
                const apiClient = createApiClient();

                const restResponse = await apiClient.get(`${config.API_BASE_URL}/api/products`, {
                    params: {
                        minSales: filtersToUse.minSales,
                        maxCommission: filtersToUse.maxCommission,
                        similarityThreshold: filtersToUse.similarityThreshold
                    }
                });

                if (restResponse.data && Array.isArray(restResponse.data.data)) {
                    if (config.USE_CACHE) {
                        try {
                            sessionStorage.setItem(cacheKey, JSON.stringify({
                                data: restResponse.data.data,
                                timestamp: Date.now()
                            }));
                        } catch (err) {
                            console.warn('Erro ao salvar cache:', err.message);
                        }
                    }

                    if (isMounted.current) {
                        setProducts(processProductData(restResponse.data.data));
                        setError(null);
                        setDataSource('api');
                        setLoading(false);
                        setRetryAttempt(0);
                    }
                    return;
                } else {
                    console.warn('Formato inesperado da API local:', restResponse.data);
                    throw new Error('Formato de dados inválido');
                }
            } catch (restError) {
                console.error('Erro na API REST:', restError);
                throw restError;
            }
        } catch (err) {
            // Verificar se devemos tentar novamente
            if (retryAttempt < config.MAX_RETRIES && isMounted.current) {
                setRetryAttempt(prev => prev + 1);
                const delay = config.RETRY_DELAY * Math.pow(2, retryAttempt);

                console.log(`Tentando novamente em ${delay}ms (${retryAttempt + 1}/${config.MAX_RETRIES})`);

                setTimeout(() => {
                    if (isMounted.current) {
                        fetchProducts(customFilters);
                    }
                }, delay);

                return;
            }

            console.error('Todas as tentativas falharam:', err);

            if (isMounted.current) {
                setProducts([]);
                setError("Falha ao buscar produtos. Verifique sua conexão e tente novamente.");
                setDataSource('error');
                setLoading(false);
            }
        }
    }, [filterOptions, retryAttempt]);

    // Buscar produtos na montagem inicial
    useEffect(() => {
        fetchProducts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Buscar produtos quando os filtros mudarem
    useEffect(() => {
        if (!isMounted.current) return;

        // Resetar tentativa de retry ao mudar filtros
        setRetryAttempt(0);
        fetchProducts();
    }, [filterOptions, fetchProducts]);

    return (
        <ProductContext.Provider value={{
            products,
            loading,
            error,
            filterOptions,
            setFilterOptions,
            dataSource,
            fetchProducts
        }}>
            {children}
        </ProductContext.Provider>
    );
};