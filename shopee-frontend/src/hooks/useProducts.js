import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import config from '../config';

// Create a more resilient axios instance with retry capability
const createApiClient = (timeout = config.API_TIMEOUT || 10000) => {
    const instance = axios.create({
        timeout,
        headers: { 'Content-Type': 'application/json' }
    });
    
    // Add request interceptor for better error tracking
    instance.interceptors.request.use(config => {
        // Add timestamp to requests for tracking
        config.metadata = { startTime: new Date() };
        return config;
    }, error => {
        return Promise.reject(error);
    });
    
    // Add response interceptor for logging and error handling
    instance.interceptors.response.use(response => {
        const duration = new Date() - response.config.metadata.startTime;
        console.log(`Request to ${response.config.url} completed in ${duration}ms`);
        return response;
    }, error => {
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.error('API Error Response:', error.response.status, error.response.data);
        } else if (error.request) {
            // The request was made but no response was received
            console.error('API No Response Error:', error.request);
        } else {
            // Something happened in setting up the request that triggered an Error
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
    const [dataSource, setDataSource] = useState('loading'); // 'api', 'local', or 'loading'
    const [retryCount, setRetryCount] = useState(0);
    const maxRetries = 3;
    
    // Use a ref to track component mount state
    const isMounted = useRef(true);
    
    // Clean up on unmount
    useEffect(() => {
        return () => {
            isMounted.current = false;
        };
    }, []);

    const fetchProducts = useCallback(async (query = searchQuery, customFilters = filters) => {
        if (!isMounted.current) return;
        
        setLoading(true);
        setError(null);
        setDataSource('loading');

        // Cache key for storing results
        const cacheKey = `products_${query || "default"}_${JSON.stringify(customFilters)}`;

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
                            setProducts(data);
                            setDataSource(source);
                            setLoading(false);
                        }
                        return data;
                    }
                }
            } catch (err) {
                console.warn('Cache retrieval failed:', err.message);
                // Continue with API requests - don't return
            }
        }

        // Try Shopee API first (if enabled)
        if (config.USE_SHOPEE_API) {
            try {
                console.log('Attempting to fetch from Shopee API with query:', query, 'and filters:', customFilters);

                const apiClient = createApiClient(8000); // Use 8 seconds timeout for GraphQL

                // Create a GraphQL request for the Shopee API
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

                if (response.data &&
                    response.data.data &&
                    response.data.data.productOfferV2 &&
                    response.data.data.productOfferV2.nodes) {

                    // Format the data to match our app's expected structure
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
                        setProducts(formattedProducts);
                        setDataSource('api');
                        setLoading(false);
                        setRetryCount(0); // Reset retry counter on success
                    }
                    return formattedProducts;
                }
            } catch (shopeeErr) {
                console.warn("Shopee API error, trying local API:", shopeeErr.message);
                // Continue to next approach - don't return here
            }
        }

        // Try local backend API next
        try {
            console.log('Attempting to fetch from local API with filters:', customFilters);
            const apiClient = createApiClient(5000); // Use 5 seconds timeout for local API

            // Prepare query parameters - handle empty values properly
            const queryParams = {
                query
            };

            // Only add parameters with actual values to the request
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
                const processedProducts = restResponse.data.data.map(product => ({
                    ...product,
                    imageUrl: validateImageUrl(product.imageUrl) ? product.imageUrl : null
                }));

                // Cache the successful result
                if (config.USE_CACHE) {
                    try {
                        sessionStorage.setItem(cacheKey, JSON.stringify({
                            data: processedProducts,
                            timestamp: Date.now(),
                            source: 'local'
                        }));
                    } catch (err) {
                        console.warn('Cache storage failed:', err.message);
                    }
                }

                if (isMounted.current) {
                    setProducts(processedProducts);
                    setDataSource('local');
                    setLoading(false);
                    setRetryCount(0); // Reset retry counter on success
                }
                return processedProducts;
            }
        } catch (localApiErr) {
            console.warn("Local API error:", localApiErr.message);
            // Continue to retry logic or fallback data
        }

        // Try to use mock data as a last resort
        try {
            console.log('Attempting to fetch mock data as fallback');
            const apiClient = createApiClient(3000);
            
            // Use a local JSON file as fallback
            const mockResponse = await apiClient.get(`${process.env.PUBLIC_URL}/mock-data/products.json`);
            
            if (mockResponse.data && Array.isArray(mockResponse.data.data)) {
                if (isMounted.current) {
                    setProducts(mockResponse.data.data);
                    setDataSource('mock');
                    setLoading(false);
                    setRetryCount(0);
                }
                return mockResponse.data.data;
            }
        } catch (mockErr) {
            console.warn("Mock data fallback failed:", mockErr.message);
        }

        // Check if retry is needed (maximum 3 retries)
        if (retryCount < maxRetries) {
            setRetryCount(prev => prev + 1);
            const delay = 1000 * Math.pow(2, retryCount); // Exponential backoff: 1s, 2s, 4s
            
            console.log(`Retrying API request in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`);
            
            setTimeout(() => {
                if (isMounted.current) {
                    fetchProducts(query, customFilters);
                }
            }, delay);
        } else {
            // All attempts failed, show error
            if (isMounted.current) {
                setError("Failed to fetch products after multiple attempts. Please check your connection and try again.");
                setDataSource('error');
                setLoading(false);
            }
        }
    }, [searchQuery, filters, retryCount]);

    // Fetch products on mount or when dependencies change
    useEffect(() => {
        fetchProducts().catch(err => {
            console.error("Error in initial product fetch:", err);
            if (isMounted.current) {
                setError("Failed to fetch products. Please try again.");
                setDataSource('error');
                setLoading(false);
            }
        });

        return () => {
            // Clear any pending requests or timeouts
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