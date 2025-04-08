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
        try {
            const filtersToUse = customFilters || filterOptions;
            console.log('Fetching products with filters:', filtersToUse);

            const response = await fetch(`/api/products?minSales=${filtersToUse.minSales}&maxCommission=${filtersToUse.maxCommission}&similarityThreshold=${filtersToUse.similarityThreshold}`);
            const data = await response.json();

            if (Array.isArray(data.data)) {
                setProducts(data.data);
            } else {
                console.warn('Unexpected data format:', data);
                setProducts([]);
            }
            setError(null);
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