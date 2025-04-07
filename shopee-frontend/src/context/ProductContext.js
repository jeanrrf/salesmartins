import React, { createContext, useState, useEffect } from 'react';
import { fetchProducts } from '../api/products';

export const ProductContext = createContext();

export const ProductProvider = ({ children }) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        minSales: 0,
        maxCommission: 100,
        similarityThreshold: 0,
    });

    useEffect(() => {
        const loadProducts = async () => {
            setLoading(true);
            try {
                const data = await fetchProducts(filters);
                setProducts(data);
            } catch (err) {
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        loadProducts();
    }, [filters]);

    const updateFilters = (name, value) => {
        setFilters((prevFilters) => ({
            ...prevFilters,
            [name]: value,
        }));
    };

    return (
        <ProductContext.Provider value={{ products, loading, error, updateFilters }}>
            {children}
        </ProductContext.Provider>
    );
};