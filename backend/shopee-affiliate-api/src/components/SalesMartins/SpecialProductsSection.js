import React, { useEffect, useState } from 'react';

const SpecialProductsSection = ({ filterParams }) => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    // Fetch products based on filterParams
    const fetchProducts = async () => {
      try {
        const response = await fetch(`/api/products?filter=${filterParams}`);
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };

    fetchProducts();
  }, [filterParams]);

  return (
    <div>
      <h2>Special Products</h2>
      <ul>
        {products.map((product) => (
          <li key={product.id}>{product.name}</li>
        ))}
      </ul>
    </div>
  );
};

export default SpecialProductsSection;