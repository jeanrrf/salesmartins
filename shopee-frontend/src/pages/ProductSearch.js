import React, { useState, useEffect } from 'react';
import { useProducts } from '../hooks/useProducts';
import FilterPanel from '../components/filters/FilterPanel';
import SearchBar from '../components/filters/SearchBar';
import ProductList from '../components/products/ProductList';

const ProductSearch = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        minSales: '',
        maxCommission: '',
        similarityThreshold: 0,
    });
    const { products, loading, error, fetchProducts } = useProducts();

    useEffect(() => {
        fetchProducts(searchTerm, filters);
    }, [searchTerm, filters, fetchProducts]);

    const handleFilterChange = (name, value) => {
        setFilters((prevFilters) => ({
            ...prevFilters,
            [name]: value,
        }));
    };

    const handleSearchChange = (term) => {
        setSearchTerm(term);
    };

    return (
        <div className="product-search">
            <h1>Product Search</h1>
            <SearchBar onSearchChange={handleSearchChange} />
            <FilterPanel onFilterChange={handleFilterChange} filterOptions={filters} />
            {loading && <p>Loading products...</p>}
            {error && <p>Error fetching products: {error.message}</p>}
            <ProductList products={products} />
        </div>
    );
};

export default ProductSearch;