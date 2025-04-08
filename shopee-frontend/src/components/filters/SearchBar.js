import React, { useState } from 'react';

const SearchBar = ({ onSearchChange, initialQuery = '' }) => {
    const [query, setQuery] = useState(initialQuery);

    const handleInputChange = (e) => {
        setQuery(e.target.value);
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (onSearchChange && typeof onSearchChange === 'function') {
            onSearchChange(query);
        }
    };

    return (
        <div className="search-bar">
            <form onSubmit={handleSearch}>
                <input
                    type="text"
                    placeholder="Search for products..."
                    value={query}
                    onChange={handleInputChange}
                    aria-label="Search products"
                />
                <button type="submit">Search</button>
            </form>
        </div>
    );
};

export default SearchBar;