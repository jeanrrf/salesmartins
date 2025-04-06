import React, { useState } from 'react';

const SalesMartins = () => {
  const [backgroundImageLoaded, setBackgroundImageLoaded] = useState(false);

  const handleImageLoad = () => {
    setBackgroundImageLoaded(true);
  };

  return (
    <div>
      <h1>Welcome to Sales Martins</h1>
      <img
        src="/path-to-your-image.jpg"
        alt="Background"
        onLoad={handleImageLoad}
        style={{ display: backgroundImageLoaded ? 'block' : 'none' }}
      />
      {backgroundImageLoaded && <p>Background image loaded successfully!</p>}
    </div>
  );
};

export default SalesMartins;