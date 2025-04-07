import { useState, useEffect } from 'react';
import { fetchProducts } from '../api/products';

const useProducts = (searchQuery, filters) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadProducts = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await fetchProducts(searchQuery, filters);
                setProducts(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        loadProducts();
    }, [searchQuery, filters]);

    return { products, loading, error };
};

export default useProducts;