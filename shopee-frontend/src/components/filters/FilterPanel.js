import React, { useState } from 'react';
import './FilterPanel.css';
import { validateFilterValues } from '../../utils/validators';

const FilterPanel = ({ onFilterChange, onRemoveProduct, filterOptions }) => {
    const [errors, setErrors] = useState({});
    const [isApplyingFilters, setIsApplyingFilters] = useState(false);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;

        // Clear previous errors
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }

        // Basic validation for numeric inputs
        if (name === 'minSales' || name === 'maxCommission') {
            // Allow empty strings
            if (value === '') {
                onFilterChange(name, value);
                return;
            }

            // Check if value is a number
            const numValue = parseFloat(value);
            if (isNaN(numValue)) {
                setErrors(prev => ({ ...prev, [name]: 'Please enter a valid number' }));
                return;
            }

            // Specific validations
            if (name === 'minSales' && numValue < 0) {
                setErrors(prev => ({ ...prev, [name]: 'Minimum sales cannot be negative' }));
                return;
            }

            if (name === 'maxCommission') {
                if (numValue < 0) {
                    setErrors(prev => ({ ...prev, [name]: 'Commission cannot be negative' }));
                    return;
                }
                if (numValue > 100) {
                    setErrors(prev => ({ ...prev, [name]: 'Maximum commission cannot exceed 100%' }));
                    return;
                }
            }
        }

        onFilterChange(name, value);
    };

    const handleApplyFilters = () => {
        // Validate all filters before applying
        const validationErrors = validateFilterValues(
            filterOptions.minSales,
            filterOptions.maxCommission,
            filterOptions.similarityThreshold
        );

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setIsApplyingFilters(true);

        // Call the filter application function
        if (onFilterChange) {
            // Trigger a re-fetch by using the special 'apply' action
            onFilterChange('apply', true);

            // Reset the applying state after a short delay
            setTimeout(() => {
                setIsApplyingFilters(false);
            }, 500);
        }
    };

    const handleRemoveProduct = (productId) => {
        if (onRemoveProduct) {
            onRemoveProduct(productId);
        }
    };

    return (
        <div className="filter-panel">
            <h2>Filter Products</h2>
            <div className="filter-option">
                <label htmlFor="minSales">Minimum Sales:</label>
                <input
                    type="number"
                    id="minSales"
                    name="minSales"
                    value={filterOptions.minSales || ''}
                    onChange={handleFilterChange}
                    min="0"
                />
                {errors.minSales && <div className="error-message">{errors.minSales}</div>}
            </div>
            <div className="filter-option">
                <label htmlFor="maxCommission">Maximum Commission (%):</label>
                <input
                    type="number"
                    id="maxCommission"
                    name="maxCommission"
                    value={filterOptions.maxCommission || ''}
                    onChange={handleFilterChange}
                    min="0"
                    max="100"
                    step="0.1"
                />
                {errors.maxCommission && <div className="error-message">{errors.maxCommission}</div>}
            </div>
            <div className="filter-option">
                <label htmlFor="similarityThreshold">
                    Similarity Threshold: {filterOptions.similarityThreshold || 0}%
                </label>
                <input
                    type="range"
                    id="similarityThreshold"
                    name="similarityThreshold"
                    min="0"
                    max="100"
                    value={filterOptions.similarityThreshold || 0}
                    onChange={handleFilterChange}
                />
                {errors.similarityThreshold && <div className="error-message">{errors.similarityThreshold}</div>}
            </div>
            <div className="filter-option">
                <button
                    onClick={handleApplyFilters}
                    disabled={isApplyingFilters}
                    className="apply-filters-button"
                >
                    {isApplyingFilters ? 'Applying...' : 'Apply Filters'}
                </button>
            </div>
            {filterOptions.selectedProductId && (
                <div className="filter-option">
                    <button
                        onClick={() => handleRemoveProduct(filterOptions.selectedProductId)}
                        className="remove-product-button"
                    >
                        Remove Selected Product
                    </button>
                </div>
            )}
        </div>
    );
};

export default FilterPanel;