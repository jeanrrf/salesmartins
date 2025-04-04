import React from 'react';

const CategoryNav = ({ categories, selectedCategory, handleCategoryClick, setLoading }) => {
  const handleClick = (categoryId) => {
    if (typeof setLoading === 'function') setLoading(true); // Ensure setLoading is a function
    handleCategoryClick(categoryId);
    if (typeof setLoading === 'function') setLoading(false);
  };

  return (
    <nav>
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => handleClick(category.id)}
          style={{ fontWeight: selectedCategory === category.id ? 'bold' : 'normal' }}
        >
          {category.name}
        </button>
      ))}
    </nav>
  );
};

export default CategoryNav;