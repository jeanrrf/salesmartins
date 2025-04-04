import React from 'react';

const SearchBar = ({ searchQuery, setSearchQuery, handleSearch }) => {
  return (
    <form onSubmit={handleSearch}>
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search..."
      />
      <button type="submit">Search</button>
    </form>
  );
};

export default SearchBar;