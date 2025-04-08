import React, { useContext } from 'react';
import { ProductContext } from '../../context/ProductContext';
import ProductCard from './ProductCard';
import Loader from '../common/Loader';
import './ProductList.css';

const ProductList = ({ products: propProducts }) => {
    // Use context products if props products not provided
    const { products: contextProducts, loading, error, dataSource } = useContext(ProductContext);

    // Determine which products to use - props take priority over context
    const products = Array.isArray(propProducts) ? propProducts : contextProducts;

    if (loading) {
        return <Loader message="Loading products, please wait..." />;
    }

    // Ensure products is always an array
    const productArray = Array.isArray(products) ? products : [];

    return (
        <div className="product-list">
            {dataSource === 'local' && (
                <div className="data-source-indicator local">
                    Using local API data
                </div>
            )}

            {dataSource === 'api' && (
                <div className="data-source-indicator api">
                    Using Shopee API data
                </div>
            )}

            {dataSource === 'mock' && (
                <div className="data-source-indicator mock">
                    Using mock data (API unavailable)
                </div>
            )}

            {error && (
                <div className="error-message">
                    {error.message || String(error)}
                </div>
            )}

            {productArray.length === 0 ? (
                <p className="no-products">
                    {error ? 'Failed to load products.' : 'No products found. Please adjust your filters or try again later.'}
                </p>
            ) : (
                <div className="product-grid">
                    {productArray.map(product => (
                        <ProductCard
                            key={product.id || product.itemId || Math.random().toString(36).substring(2, 9)}
                            product={product}
                            onAddToCart={(id) => console.log('Add to cart:', id)}
                            onViewDetails={(id) => console.log('View details:', id)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default ProductList;