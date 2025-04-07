import React, { useContext, useEffect } from 'react';
import { ProductContext } from '../../context/ProductContext';
import ProductCard from './ProductCard';
import Loader from '../common/Loader';

const ProductList = () => {
    const { products, loading, error, fetchProducts } = useContext(ProductContext);

    useEffect(() => {
        // Only call fetchProducts if it exists
        if (fetchProducts && typeof fetchProducts === 'function') {
            fetchProducts().catch(err => console.error("Error fetching products:", err));
        }
    }, [fetchProducts]);

    if (loading) {
        return <Loader />;
    }

    if (error) {
        return <div className="error-message">Error: {error.message || String(error)}</div>;
    }

    return (
        <div className="product-list">
            {!products || products.length === 0 ? (
                <p>No products found.</p>
            ) : (
                products.map(product => (
                    <ProductCard 
                        key={product.id || product.itemId} 
                        product={product} 
                        onAddToCart={() => {}} 
                        onViewDetails={() => {}}
                    />
                ))
            )}
        </div>
    );
};

export default ProductList;