import React, { useState } from 'react';
import './FilterPanel.css';

const FilterPanel = ({ onFilterChange, onSortChange, currentSort = 'most-sold' }) => {
    const [sortOption, setSortOption] = useState(currentSort);
    const [hideInventoryItems, setHideInventoryItems] = useState(true);

    const handleSortChange = (event) => {
        const newSortOption = event.target.value;
        setSortOption(newSortOption);
        if (onSortChange && typeof onSortChange === 'function') {
            onSortChange(newSortOption);
        }
    };

    const handleInventoryToggle = (event) => {
        const checked = event.target.checked;
        setHideInventoryItems(checked);
        if (onFilterChange && typeof onFilterChange === 'function') {
            onFilterChange('hideInventoryItems', checked);
        }
    };

    // Safe handler for apply button
    const handleApplyClick = () => {
        if (onSortChange && typeof onSortChange === 'function') {
            onSortChange(sortOption);
        } else if (onFilterChange && typeof onFilterChange === 'function') {
            // Fallback to using onFilterChange if onSortChange is not available
            onFilterChange('sortBy', sortOption);
        }
    };

    return (
        <div className="filter-panel">
            <h2>Filtrar e Ordenar Produtos</h2>
            
            <div className="filter-option">
                <label htmlFor="sort-options">Ordenar por:</label>
                <select 
                    id="sort-options" 
                    value={sortOption}
                    onChange={handleSortChange}
                    className="sort-select"
                >
                    <option value="most-sold">Mais Vendidos</option>
                    <option value="highest-discount">Maiores Descontos</option>
                </select>
            </div>
            
            <div className="filter-option checkbox-option">
                <input
                    type="checkbox"
                    id="hideInventoryItems"
                    checked={hideInventoryItems}
                    onChange={handleInventoryToggle}
                />
                <label htmlFor="hideInventoryItems">
                    Ocultar itens já existentes no estoque
                </label>
            </div>
            
            <div className="filter-actions">
                <button 
                    className="apply-button"
                    onClick={handleApplyClick}
                >
                    Aplicar
                </button>
            </div>
        </div>
    );
};

export default FilterPanel;