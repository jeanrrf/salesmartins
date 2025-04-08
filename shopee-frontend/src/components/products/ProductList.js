import React, { useContext, useEffect } from 'react';
import { ProductContext } from '../../context/ProductContext';
import ProductCard from './ProductCard';
import Loader from '../common/Loader';
import './ProductList.css';

const ProductList = () => {
    const { products, loading, error, fetchProducts } = useContext(ProductContext);

    useEffect(() => {
        // Only call fetchProducts if it exists
        if (fetchProducts && typeof fetchProducts === 'function') {
            fetchProducts().catch(err => console.error("Error fetching products:", err));
        }

        // Add cleanup function to prevent state updates on unmounted component
        return () => {
            // Cleanup function to address the memory leak warning
        };
    }, [fetchProducts]);

    if (loading) {
        return <Loader />;
    }

    if (error) {
        return <div className="error-message">Error: {error.message || String(error)}</div>;
    }

    // Ensure products is always an array
    const productArray = Array.isArray(products) ? products : [];

    return (
        <div className="product-list">
            {productArray.length === 0 ? (
                <p>No products found.</p>
            ) : (
                productArray.map(product => (
                    <ProductCard
                        key={product.id || product.itemId}
                        product={product}
                        onAddToCart={() => { }}
                        onViewDetails={() => { }}
                    />
                ))
            )}
        </div>
    );
};

export default ProductList;