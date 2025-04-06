import React, { useState } from 'react';

const SalesMartins = () => {
  const [popularCategories, setPopularCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showContactForm, setShowContactForm] = useState(false);

  return (
    <div>
      <h1>Welcome to Sales Martins</h1>
      <p>Explore our popular categories and products.</p>
      <div className="popular-categories">
        <h2>Popular Categories</h2>
        {popularCategories.map((category) => (
          <button key={category.id} onClick={() => setSelectedCategory(category)}>
            {category.name}
          </button>
        ))}
      </div>
      <p>Background image loaded successfully!</p>
    </div>
  );
};

export default SalesMartins;