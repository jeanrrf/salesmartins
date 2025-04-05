import React from 'react';
import styles from './CategoryList.module.css';
import { FaHome, FaTshirt, FaCouch, FaBaby, FaCar, FaTools } from 'react-icons/fa';

const CategoryList = ({ categories, selectedCategory, onCategoryClick }) => {
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
    <div className={styles.categorySidebar}>
      <button
        className={`${styles.categoryItem} ${selectedCategory === null ? styles.active : ''}`}
        onClick={() => onCategoryClick(null)}
      >
        <span className={styles.categoryIcon}><FaHome /></span>
        <span className={styles.categoryLabel}>Todos</span>
      </button>
      {categories.map((category) => (
        <button
          key={category.id}
          className={`${styles.categoryItem} ${selectedCategory === category.id ? styles.active : ''}`}
          onClick={() => onCategoryClick(category.id)}
        >
          <span className={styles.categoryIcon}>{getCategoryIcon(category.name)}</span>
          <span className={styles.categoryLabel}>{category.name}</span>
        </button>
      ))}
    </div>
  );
};

export default CategoryList;