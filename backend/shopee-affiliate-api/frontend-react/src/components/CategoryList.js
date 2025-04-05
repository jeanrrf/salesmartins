import React from 'react';
import './CategoryList.module.css';
import { FaHome, FaTshirt, FaCouch, FaBaby, FaCar, FaTools } from 'react-icons/fa'; // Novos ícones

const CategoryList = ({ categories, onCategoryClick }) => {
  const getCategoryIcon = (categoryName) => {
    const name = categoryName.toLowerCase();

    if (name.includes('eletrônico')) return <FaTools />;
    if (name.includes('ferramenta') || name.includes('construção')) return <FaTools />;
    if (name.includes('beleza') || name.includes('cuidado')) return <FaBaby />;
    if (name.includes('casa') || name.includes('decoração')) return <FaCouch />;
    if (name.includes('moda')) return <FaTshirt />;
    if (name.includes('automotivo')) return <FaCar />;

    return <FaHome />;
  };

  return (
    <div className="categoryList">
      {categories.map((category) => (
        <button
          key={category.id}
          className="categoryButton"
          onClick={() => onCategoryClick(category.id)}
        >
          {getCategoryIcon(category.name)} {category.name}
        </button>
      ))}
    </div>
  );
};

export default CategoryList;