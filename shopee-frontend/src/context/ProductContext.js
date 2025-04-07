import React, { createContext, useState, useEffect, useCallback } from 'react';
import { fetchProducts as apiFetchProducts } from '../api/products';

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

    // Create a memoized fetchProducts function
    const fetchProducts = useCallback(async (customFilters) => {
        setLoading(true);
        try {
            const filtersToUse = customFilters || filterOptions;
            const data = await apiFetchProducts(filtersToUse);
            setProducts(data);
            return data;
        } catch (err) {
            setError(err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [filterOptions]);

    // Initial data loading
    useEffect(() => {
        fetchProducts().catch(err => console.error("Error fetching initial products:", err));
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