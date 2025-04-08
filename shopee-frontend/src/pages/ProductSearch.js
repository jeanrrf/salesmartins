import React, { useState, useEffect } from 'react';
import { useProducts } from '../hooks/useProducts';
import FilterPanel from '../components/filters/FilterPanel';
import SearchBar from '../components/filters/SearchBar';
import ProductList from '../components/products/ProductList';
import { validateProductSearch, validateFilterValues } from '../utils/validators';

const ProductSearch = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        minSales: '',
        maxCommission: '',
        similarityThreshold: 0,
    });
    const { products, loading, error, fetchProducts } = useProducts();

    useEffect(() => {
        // Initial fetch
        fetchProducts(searchTerm, filters);
    }, [fetchProducts]);

    const handleFilterChange = (name, value) => {
        const newFilters = {
            ...filters,
            [name]: value,
        };
        
        // Validate filter values
        if (validateFilterValues(newFilters.minSales, newFilters.maxCommission)) {
            setFilters(newFilters);
            fetchProducts(searchTerm, newFilters);
        }
    };

    const handleSearchChange = (term) => {
        // Validate search term
        if (validateProductSearch(term)) {
            setSearchTerm(term);
            fetchProducts(term, filters);
        }
    };

    return (
        <div className="product-search">
            <h1>Product Search</h1>
            <SearchBar onSearchChange={handleSearchChange} />
            <FilterPanel onFilterChange={handleFilterChange} filterOptions={filters} />
            {loading && <p>Loading products...</p>}
            {error && <p className="error-message">Error fetching products: {error.message || error}</p>}
            <ProductList products={products} />
        </div>
    );
};

export default ProductSearch;