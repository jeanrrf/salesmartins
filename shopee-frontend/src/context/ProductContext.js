import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
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
        try {
            const filtersToUse = customFilters || filterOptions;
            const data = await apiFetchProducts(filtersToUse);

            // Only update state if component is still mounted
            if (isMounted.current) {
                // Ensure data is an array
                setProducts(Array.isArray(data) ? data : []);
                setError(null);
            }
            return data;
        } catch (err) {
            // Only update state if component is still mounted
            if (isMounted.current) {
                setError(err);
                setProducts([]);
            }
            throw err;
        } finally {
            // Only update state if component is still mounted
            if (isMounted.current) {
                setLoading(false);
            }
        }
    }, [filterOptions]);

    // Initial data loading
    useEffect(() => {
        fetchProducts().catch(err => {
            if (isMounted.current) {
                console.error("Error fetching initial products:", err);
            }
        });
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