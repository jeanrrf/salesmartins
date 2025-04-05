import React from 'react';
import styles from './CategoryList.module.css';
import { 
  FaHome, 
  FaShoppingBag,
  FaLaptop, 
  FaTshirt, 
  FaGem,
  FaHeart,
  FaBabyCarriage,
  FaFootballBall,
  FaUtensils,
  FaGuitar,
  FaBook,
  FaPlane,
  FaCar,
  FaCouch,
  FaMobileAlt,
  FaHeadphones,
  FaGamepad,
  FaTools
} from 'react-icons/fa';

const CategoryList = ({ categories, selectedCategory, onCategoryClick }) => {
  const getCategoryIcon = (categoryName) => {
    if (!categoryName) return <FaHome />;

    const name = categoryName.toLowerCase();
    if (name.includes('eletrônico')) return <FaLaptop />;
    if (name.includes('celular') || name.includes('smartphone')) return <FaMobileAlt />;
    if (name.includes('game') || name.includes('jogo')) return <FaGamepad />;
    if (name.includes('ferramenta') || name.includes('construção')) return <FaTools />;
    if (name.includes('beleza') || name.includes('cuidado')) return <FaGem />;
    if (name.includes('casa') || name.includes('decoração')) return <FaCouch />;
    if (name.includes('moda')) return <FaShoppingBag />;
    if (name.includes('automotivo')) return <FaCar />;
    if (name.includes('bebê') || name.includes('infantil') || name.includes('criança')) return <FaBabyCarriage />;
    if (name.includes('cozinha') || name.includes('utensílios')) return <FaUtensils />;
    if (name.includes('livro') || name.includes('educação')) return <FaBook />;
    if (name.includes('esporte')) return <FaFootballBall />;
    if (name.includes('música') || name.includes('instrumento')) return <FaGuitar />;
    if (name.includes('viagem')) return <FaPlane />;
    if (name.includes('saúde')) return <FaHeart />;
    if (name.includes('audio') || name.includes('som')) return <FaHeadphones />;
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

      {categories && categories.map((category) => (
        <button
          key={category.id}
          className={`${styles.categoryItem} ${selectedCategory === category.id ? styles.active : ''}`}
          onClick={() => onCategoryClick(category.id)}
        >
          <span className={styles.categoryIcon}>
            {category.icon || getCategoryIcon(category.name)}
          </span>
          <span className={styles.categoryLabel}>{category.name}</span>
        </button>
      ))}
    </div>
  );
};

export default CategoryList;