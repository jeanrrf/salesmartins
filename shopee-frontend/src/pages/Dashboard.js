import React, { useEffect, useContext } from 'react';
import { ProductContext } from '../context/ProductContext';
import ProductList from '../components/products/ProductList';
import FilterPanel from '../components/filters/FilterPanel';
import SearchBar from '../components/filters/SearchBar';

const Dashboard = () => {
    const { products, fetchProducts, filterOptions, setFilterOptions } = useContext(ProductContext);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const handleFilterChange = (name, value) => {
        setFilterOptions(prev => ({ ...prev, [name]: value }));
    };

    const handleRemoveProduct = (productId) => {
        // Logic to remove product from the list or perform an API call
    };

    return (
        <div className="dashboard">
            <h1>Product Dashboard</h1>
            <SearchBar />
            <FilterPanel 
                onFilterChange={handleFilterChange} 
                onRemoveProduct={handleRemoveProduct} 
                filterOptions={filterOptions} 
            />
            <ProductList products={products} />
        </div>
    );
};

export default Dashboard;