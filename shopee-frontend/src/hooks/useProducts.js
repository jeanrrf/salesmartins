import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import config from '../config';

// Mock data to use as a fallback
const MOCK_PRODUCTS = [
    {
        id: 1,
        name: "Fallback Product 1",
        price: 19.99,
        imageUrl: "https://via.placeholder.com/150",
        sales: 100,
        commission: 5
    },
    {
        id: 2,
        name: "Fallback Product 2",
        price: 29.99,
        imageUrl: "https://via.placeholder.com/150",
        sales: 200,
        commission: 7
    }
];

export const useProducts = (initialSearchQuery = '', initialFilters = {}) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
    const [filters, setFilters] = useState(initialFilters);
    const [dataSource, setDataSource] = useState('api'); // 'api', 'local', or 'mock'

    const fetchProducts = useCallback(async (query = searchQuery, customFilters = filters) => {
        setLoading(true);
        setError(null);

        // Try Shopee API first (if enabled)
        if (config.USE_SHOPEE_API) {
            try {
                console.log('Attempting to fetch from Shopee API with query:', query, 'and filters:', customFilters);

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

                const response = await axios.post(config.GRAPHQL_ENDPOINT, graphqlRequest, {
                    timeout: 3000 // Short timeout to fail faster
                });

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
                    setDataSource('api');
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
            const restResponse = await axios.get(`${config.API_BASE_URL}/api/products`, {
                params: {
                    query,
                    ...customFilters
                },
                timeout: 3000 // Short timeout to fail faster
            });

            if (restResponse.data && Array.isArray(restResponse.data.data)) {
                setProducts(restResponse.data.data);
                setDataSource('local');
                setLoading(false);
                return restResponse.data.data;
            }
        } catch (localApiErr) {
            console.warn("Local API error, using mock data:", localApiErr.message);
            // Continue to fallback
        }

        // Finally, fall back to mock data if everything else fails
        console.log('Using mock data as fallback');
        // Apply filters to mock data
        const filteredMockData = MOCK_PRODUCTS.filter(product => {
            return (
                product.sales >= (customFilters.minSales || 0) &&
                product.commission <= (customFilters.maxCommission || 100)
            );
        });

        setProducts(filteredMockData);
        setDataSource('mock');
        setLoading(false);
        return filteredMockData;
    }, [searchQuery, filters]);

    useEffect(() => {
        fetchProducts(searchQuery, filters).catch(err => {
            console.error("Error in fetchProducts effect:", err);
            setError("Failed to fetch products. Using mock data.");
            setProducts(MOCK_PRODUCTS);
            setDataSource('mock');
            setLoading(false);
        });
    }, [fetchProducts, searchQuery, filters]);

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