import React from 'react';

const ProductList = ({ products, loading }) => {
  if (loading) return <p>Loading...</p>;

  return (
    <ul>
      {products.map((product) => (
        <li key={product.id}>{product.name}</li>
      ))}
    </ul>
  );
};

export default ProductList;