import React, { useContext, useEffect } from 'react';
import { ProductContext } from '../context/ProductContext';
import ProductList from '../components/products/ProductList';
import FilterPanel from '../components/filters/FilterPanel';
import SearchBar from '../components/filters/SearchBar';

const ProductManagement = () => {
    const { products, fetchProducts, filterOptions, setFilterOptions } = useContext(ProductContext);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const handleFilterChange = (name, value) => {
        setFilterOptions(prev => ({ ...prev, [name]: value }));
    };

    const handleRemoveProduct = (productId) => {
        // Logic to remove product
    };

    return (
        <div className="product-management">
            <h1>Product Management</h1>
            <SearchBar onSearch={fetchProducts} />
            <FilterPanel 
                onFilterChange={handleFilterChange} 
                onRemoveProduct={handleRemoveProduct} 
                filterOptions={filterOptions} 
            />
            <ProductList products={products} />
        </div>
    );
};

export default ProductManagement;