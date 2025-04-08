import { useState, useEffect, useCallback } from 'react';
import { fetchProducts as apiFetchProducts, searchProducts as apiSearchProducts } from '../api/products';

export const useProducts = (initialSearchQuery = '', initialFilters = {}) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
    const [filters, setFilters] = useState(initialFilters);

    const fetchProducts = useCallback(async (query = searchQuery, customFilters = filters) => {
        setLoading(true);
        setError(null);
        try {
            let data;
            
            // If there's a search query, use the dedicated search endpoint
            if (query && query.trim().length > 0) {
                console.log('Using search endpoint with query:', query);
                data = await apiSearchProducts(query, customFilters);
            } else {
                console.log('Using fetch products endpoint with filters:', customFilters);
                data = await apiFetchProducts(query, customFilters);
            }
            
            setProducts(data);
            return data;
        } catch (err) {
            setError(err.message || "Failed to fetch products");
            console.error("Error fetching products:", err);
        } finally {
            setLoading(false);
        }
    }, [searchQuery, filters]);

    useEffect(() => {
        fetchProducts(searchQuery, filters);
    }, [fetchProducts, searchQuery, filters]);

    return { 
        products, 
        loading, 
        error, 
        fetchProducts,
        searchQuery,
        setSearchQuery,
        filters,
        setFilters
    };
};

// Keep the default export for backward compatibility
export default useProducts;