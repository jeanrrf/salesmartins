import React, { useContext, useEffect } from 'react';
import { ProductContext } from '../context/ProductContext';
import ProductList from '../components/products/ProductList';
import FilterPanel from '../components/filters/FilterPanel';
import SearchBar from '../components/filters/SearchBar';

const Dashboard = () => {
    const { products, fetchProducts, filterOptions, setFilterOptions } = useContext(ProductContext);

    useEffect(() => {
        // Only call fetchProducts if it exists
        if (fetchProducts && typeof fetchProducts === 'function') {
            fetchProducts().catch(err => console.error("Error fetching products:", err));
        }
    }, [fetchProducts]);

    const handleFilterChange = (name, value) => {
        setFilterOptions(prev => ({ ...prev, [name]: value }));
    };

    const handleRemoveProduct = (productId) => {
        // Logic to remove product from the list or perform an API call
        console.log("Remove product:", productId);
    };

    return (
        <div className="dashboard">
            <h1>Product Dashboard</h1>
            <SearchBar onSearch={(term) => console.log("Searching for:", term)} />
            <FilterPanel 
                onFilterChange={handleFilterChange} 
                onRemoveProduct={handleRemoveProduct} 
                filterOptions={filterOptions} 
            />
            <ProductList />
        </div>
    );
};

export default Dashboard;