import React, { useContext, useEffect } from 'react';
import { ProductContext } from '../../context/ProductContext';
import ProductCard from './ProductCard';
import Loader from '../common/Loader';

const ProductList = () => {
    const { products, loading, fetchProducts } = useContext(ProductContext);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    if (loading) {
        return <Loader />;
    }

    return (
        <div className="product-list">
            {products.length === 0 ? (
                <p>No products found.</p>
            ) : (
                products.map(product => (
                    <ProductCard key={product.id} product={product} />
                ))
            )}
        </div>
    );
};

export default ProductList;