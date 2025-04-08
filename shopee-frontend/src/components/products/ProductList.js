import React, { useContext } from 'react';
import { ProductContext } from '../../context/ProductContext';
import ProductCard from './ProductCard';
import Loader from '../common/Loader';
import './ProductList.css';

const ProductList = () => {
    const { products, loading, error } = useContext(ProductContext);

    if (loading) {
        return <Loader />;
    }

    if (error) {
        return <div className="error-message">Error: {error.message || String(error)}</div>;
    }

    // Ensure products is always an array
    const productArray = Array.isArray(products) ? products : [];

    console.log("Rendering ProductList with products:", productArray.length);

    return (
        <div className="product-list">
            {productArray.length === 0 ? (
                <p>No products found. Please adjust your filters or try again later.</p>
            ) : (
                productArray.map(product => (
                    <ProductCard
                        key={product.id || product.itemId}
                        product={product}
                        onAddToCart={() => console.log('Add to cart:', product.id)}
                        onViewDetails={() => console.log('View details:', product.id)}
                    />
                ))
            )}
        </div>
    );
};

export default ProductList;