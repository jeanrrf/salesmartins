import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import config from '../config';

// Mock data for fallback

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

    // Create a memoized fetchProducts function
    const fetchProducts = useCallback(async (customFilters) => {
        setLoading(true);
        const filtersToUse = customFilters || filterOptions;
        console.log('Fetching products with filters:', filtersToUse);
        
        try {
            // Try Shopee API first via GraphQL (if enabled)
            if (config.USE_SHOPEE_API) {
                try {
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

                    const response = await axios.post(
                        config.GRAPHQL_ENDPOINT, 
                        graphqlRequest,
                        { timeout: 3000 } // Short timeout to fail faster
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
                        
                        setProducts(formattedProducts);
                        setError(null);
                        setLoading(false);
                        return;
                    }
                } catch (graphqlError) {
                    console.error("GraphQL API error, falling back to REST API:", graphqlError);
                }
            }

            // Try local REST API next
            try {
                const restResponse = await axios.get(`${config.API_BASE_URL}/api/products`, {
                    params: {
                        minSales: filtersToUse.minSales,
                        maxCommission: filtersToUse.maxCommission,
                        similarityThreshold: filtersToUse.similarityThreshold
                    },
                    timeout: 3000 // Short timeout to fail faster
                });

                if (restResponse.data && Array.isArray(restResponse.data.data)) {
                    setProducts(restResponse.data.data);
                    setError(null);
                    setLoading(false);
                    return;
                } else {
                    console.warn('Unexpected data format from local API:', restResponse.data);
                    throw new Error('Invalid data format');
                }
            } catch (restError) {
                console.error('REST API error, using mock data:', restError);
                throw restError; // Allow to fall through to mock data
            }
        } catch (err) {
            console.error('Error fetching products:', err);
            setError(err.message || 'Failed to fetch products');
            setProducts([]);
        } finally {
            setLoading(false);
        }
    }, [filterOptions]);

    // Initial data loading - only run once
    useEffect(() => {
        if (!initialFetchDone.current) {
            initialFetchDone.current = true;
            fetchProducts().catch(err => {
                if (isMounted.current) {
                    console.error("Error fetching initial products:", err);
                }
            });
        }
    }, [fetchProducts]);

    return (
        <ProductContext.Provider value={{
            products,
            loading,
            error,
            fetchProducts,
            filterOptions,
            setFilterOptions
        }}>
            {children}
        </ProductContext.Provider>
    );
};