import React from 'react';
import './FilterPanel.css';

const FilterPanel = ({ onFilterChange, onRemoveProduct, filterOptions }) => {
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        onFilterChange(name, value);
    };

    const handleRemoveProduct = (productId) => {
        onRemoveProduct(productId);
    };

    return (
        <div className="filter-panel">
            <h2>Filter Products</h2>
            <div className="filter-option">
                <label htmlFor="sales">Minimum Sales:</label>
                <input
                    type="number"
                    id="sales"
                    name="minSales"
                    onChange={handleFilterChange}
                />
            </div>
            <div className="filter-option">
                <label htmlFor="commission">Maximum Commission:</label>
                <input
                    type="number"
                    id="commission"
                    name="maxCommission"
                    onChange={handleFilterChange}
                />
            </div>
            <div className="filter-option">
                <label htmlFor="similarity">Similarity Threshold:</label>
                <input
                    type="range"
                    id="similarity"
                    name="similarityThreshold"
                    min="0"
                    max="100"
                    onChange={handleFilterChange}
                />
            </div>
            <div className="filter-option">
                <button onClick={() => handleRemoveProduct(filterOptions.selectedProductId)}>
                    Remove Selected Product
                </button>
            </div>
        </div>
    );
};

export default FilterPanel;