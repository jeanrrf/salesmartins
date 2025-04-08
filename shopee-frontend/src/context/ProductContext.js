import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import config from '../config';

// Create a more resilient axios instance with better timeouts
const createApiClient = (timeout = config.API_TIMEOUT) => {
    return axios.create({
        timeout,
        headers: { 'Content-Type': 'application/json' }
    });
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
    const [dataSource, setDataSource] = useState('loading'); // 'api', 'local' or 'loading'
    const [retryAttempt, setRetryAttempt] = useState(0);

    // Track if the initial fetch has been performed
    const initialFetchDone = useRef(false);

    // Use a ref to track mounted state
    const isMounted = useRef(true);

    // Set isMounted to false when the component unmounts
    useEffect(() => {
        return () => {
            isMounted.current = false;
        };
    }, []);

    // Helper function to validate and process URLs
    const processProductData = (productsData) => {
        return productsData.map(product => ({
            ...product,
            // Ensure we don't have any via.placeholder.com URLs
            imageUrl: product.imageUrl && !product.imageUrl.includes('via.placeholder.com')
                ? product.imageUrl
                : null
        }));
    };

    // Create a memoized fetchProducts function
    const fetchProducts = useCallback(async (customFilters) => {
        if (!isMounted.current) return;

        setLoading(true);
        setError(null);
        const filtersToUse = customFilters || filterOptions;
        console.log('Fetching products with filters:', filtersToUse);

        // Cache key for storing results
        const cacheKey = `products_context_${JSON.stringify(filtersToUse)}`;

        // Try to get from session storage cache first
        if (config.USE_CACHE) {
            try {
                const cached = sessionStorage.getItem(cacheKey);
                if (cached) {
                    const { data, timestamp, source } = JSON.parse(cached);
                    // Only use cache if it's less than 5 minutes old
                    if (Date.now() - timestamp < 5 * 60 * 1000) {
                        console.log('Using cached data from', source);
                        if (isMounted.current) {
                            setProducts(processProductData(data));
                            setDataSource(source);
                            setLoading(false);
                            setError(null);
                        }
                        return data;
                    }
                }
            } catch (err) {
                console.warn('Cache retrieval failed:', err.message);
                // Continue with API requests - don't return
            }
        }

        try {
            // Try Shopee API first via GraphQL (if enabled)
            if (config.USE_SHOPEE_API) {
                try {
                    const apiClient = createApiClient(8000); // Use 8 seconds timeout for GraphQL

                    // Try GraphQL API first
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
                            sortType: 2, // Sort by popularity
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

                    // Process successful GraphQL response...
                    if (response.data &&
                        response.data.data &&
                        response.data.data.productOfferV2 &&
                        response.data.data.productOfferV2.nodes) {

                        // Format the data to match our app's expected structure
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

                        // Cache the successful result
                        if (config.USE_CACHE) {
                            try {
                                sessionStorage.setItem(cacheKey, JSON.stringify({
                                    data: formattedProducts,
                                    timestamp: Date.now(),
                                    source: 'api'
                                }));
                            } catch (err) {
                                console.warn('Cache storage failed:', err.message);
                            }
                        }

                        if (isMounted.current) {
                            setProducts(processProductData(formattedProducts));
                            setError(null);
                            setDataSource('api');
                            setLoading(false);
                            setRetryAttempt(0); // Reset retry counter
                        }
                        return;
                    }
                } catch (graphqlError) {
                    console.error("GraphQL API error, falling back to REST API:", graphqlError);
                }
            }

            // Try local REST API next
            try {
                const apiClient = createApiClient(5000); // Use 5 seconds timeout for local API

                const restResponse = await apiClient.get(`${config.API_BASE_URL}/api/products`, {
                    params: {
                        minSales: filtersToUse.minSales,
                        maxCommission: filtersToUse.maxCommission,
                        similarityThreshold: filtersToUse.similarityThreshold
                    }
                });

                if (restResponse.data && Array.isArray(restResponse.data.data)) {
                    // Cache the successful result
                    if (config.USE_CACHE) {
                        try {
                            sessionStorage.setItem(cacheKey, JSON.stringify({
                                data: restResponse.data.data,
                                timestamp: Date.now(),
                                source: 'local'
                            }));
                        } catch (err) {
                            console.warn('Cache storage failed:', err.message);
                        }
                    }

                    if (isMounted.current) {
                        setProducts(processProductData(restResponse.data.data));
                        setError(null);
                        setDataSource('local');
                        setLoading(false);
                        setRetryAttempt(0); // Reset retry counter
                    }
                    return;
                } else {
                    console.warn('Unexpected data format from local API:', restResponse.data);
                    throw new Error('Invalid data format');
                }
            } catch (restError) {
                console.error('REST API error:', restError);
                throw restError; // Allow to fall through to retry or error handling
            }
        } catch (err) {
            // Check if we should retry (max 3 attempts)
            if (retryAttempt < config.MAX_RETRIES && isMounted.current) {
                setRetryAttempt(prev => prev + 1);
                const delay = config.RETRY_DELAY * Math.pow(2, retryAttempt);

                console.log(`API retry ${retryAttempt + 1}/${config.MAX_RETRIES} in ${delay}ms`);

                setTimeout(() => {
                    if (isMounted.current) {
                        fetchProducts(customFilters);
                    }
                }, delay);

                return;
            }

            console.error('All API attempts failed:', err);

            if (isMounted.current) {
                setProducts([]);
                setError("Failed to fetch products. Please check your connection and try again.");
                setDataSource('error');
                setLoading(false);
            }
        }
    }, [filterOptions, retryAttempt]);

    // Initial data loading - only run once
    useEffect(() => {
        if (!initialFetchDone.current) {
            initialFetchDone.current = true;
            fetchProducts().catch(err => {
                if (isMounted.current) {
                    console.error("Error fetching initial products:", err);
                    setError("Failed to fetch initial products. Please try again later.");
                    setLoading(false);
                }
            });
        }
    }, [fetchProducts]);

    // Clear cache when component unmounts
    useEffect(() => {
        return () => {
            if (config.CLEAR_CACHE_ON_UNMOUNT) {
                try {
                    Object.keys(sessionStorage).forEach(key => {
                        if (key.startsWith('products_context_')) {
                            sessionStorage.removeItem(key);
                        }
                    });
                } catch (err) {
                    console.warn('Error clearing cache:', err);
                }
            }
        };
    }, []);

    return (
        <ProductContext.Provider value={{
            products,
            loading,
            error,
            fetchProducts,
            filterOptions,
            setFilterOptions,
            dataSource
        }}>
            {children}
        </ProductContext.Provider>
    );
};