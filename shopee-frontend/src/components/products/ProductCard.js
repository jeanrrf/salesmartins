import React, { useState } from 'react';
import './ProductCard.css';

// Base64 placeholder image instead of importing a file
const placeholderImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAMAAABrrFhUAAAAP1BMVEX///+/v7/f39+fn5+Pj49fX19vb2+vr69PT08/Pz8fHx8AAAD39/fn5+dDQ0MvLy/Pz88PDw9zc3NjY2MRERH6xdcuAAAFLUlEQVR4nO2d65abOBBFJYEkQDyMmf//W3sd90xPQimlt4GJ9v7WymJO6VA8JJD49QUhhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCSOKM3aBUw+/HnPKGqSZXuDzO/9j92bbV3p5aagS3dePL8a31jMa6MHuYlB2r9+lm11yl/Pu0/Vfc3dFnoucYhlm6BuAVgM86AK8AnPEAUBgAYggAYggAYjQAQzl9igAg5rNWbVv3OQKAmMPU12VZH9oRAEQcbVOW6+8/liqvDpQArG9L+33vX3YEABEPvwe5LlujEwFAxOB+14An0AWgOJzd3wDWCGqNCAACHt1NAMMcPwBzHKPbPN8AaLThA+iud3+dAdRQ+ACmi3sDcN0mfwZUAeQQPoDXu/81gGVeohPIEcDL7v8GwDxEJ5AjgMsrfy8AOo0IgD+AEXgPCPwUiBzAfvN8A9ig5RDqAQbyGvBcB7ScggfguxBe68B5CRvA4G7eH4DjFHjgAK5vAKesAmEDeHkJfANgBiU6hcwA3O7+PwGISiEzAL/cAFtbNJtApgB+rl7It0OPEppCVgDex47LU8DURCeRFYDn05fz87fvQxOdRFYATNftul2vo5V9MlAzgLn199dx8dj7PQdAkQuAcfDf+4tu85wShAPgMLpXY47zuZ3ax6OvZZZDAqgFwGhN+XLQxrbtpzrQb9AFwAOAC+2zwdUE4mSgfgC9bEx5N7orEJOB+gFYU/q/yJnsOkQbgcwA9K703j41oJOB2gEMnfRl0LxEdKB2AHs3BI0x0UagdgCDk3TgeaL3GAgZwGikE2DWw94FwgUwbGUjcCZgBGoHMIv7rz0Bmwy0A7hvthtZAob71K5DADBvxgNTEdGBdgD9Vla9ZZXfA+ECkLeBOYF7jPWGERiAzf3vOYI8BeICGD8O4OprZgKsDzQD2MymCrPW23Ugo30FoQK4yQ0Ym8A8hO3IWADMM0ybwMwIFcC21ZwCZ0MpBgB+FzP+IhgFAvcsRAB6sywYh46icA0IEUCvtQCDYQQZgfoBmMnzJ7+DSQbaARjDCITvANkBtLJrAXgG3wLCA+B/LfQ7Jng6dKL3gOAAvP7tz38JPA/LJnAA3h9DBjgLUEugt0NwAOZ/ZCBZB8wdMp3AVQYHgOHHkMG0xtj0of2/DQ6Aob3+jtG0tq2b9vR5MI0uQABsHn7N2Nlrl1UHjvsMCFC5QA2w75qT8ahQswRi/UGyBrj2/cgfOjbVw/Vp+HMUN4BxvEj6L/vD0jxsm/HC+x/NrwfIAEax9yYw3lrfy5a3z6lA6Aw4AB5GkA1Eznyf+r657h/eNaDRBQ3A6MajkhFIBY5H29oSfhtkoAnUl8dwUwB/+UhEYGbW17Fvmqb9c2Z6v3YIwGKeBjb/Pb9d/TdN4ZzPsxj2aWirDTiA0dT3AkDZC9SEQgcwlm0O0sVAVA7BAxjLJhBwXA+hABhNGeYlIFQAZlkDIT0IQgUw7vffLb9JQAhADLr/CQDAA6D7pwBADsqb3eepBNycPvF8Dv5+QgAQcz6c3g8Cgwcg5miMUeX6UA0GDkDQ/WnfPD2VaVGIACAo//q0FFJC/NsIAILO7cf3hwAg6fJ+DAFAxL65LT9/HQRAUMA/EoUAIIYAIIYAIIYAIIYAIOZjAHz8/wUQvwDU/n8BtH891ST58UTp8UQOAmapmj+OsZITvx9aJp29bJr1hP85YSCEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIueUfnMMv+0mTsXMAAAAASUVORK5CYII=';

const ProductCard = ({ product, onAddToCart, onViewDetails }) => {
    const [imageError, setImageError] = useState(false);

    // Handle image error by replacing with default image
    const handleImageError = (e) => {
        console.log('Image failed to load, using placeholder');
        setImageError(true);
        e.target.onerror = null; // Prevent infinite loop if default image also fails
    };

    // Use a valid image URL or fallback to local placeholder
    const imageUrl = imageError || !product?.imageUrl ? placeholderImage : product.imageUrl;

    return (
        <div className="product-card">
            <img
                src={imageUrl}
                alt={product?.name || 'Product Image'}
                className="product-image"
                onError={handleImageError}
            />
            <h3 className="product-name">{product?.name || 'Unnamed Product'}</h3>
            <p className="product-price">
                {product?.price !== undefined ? `$${product.price.toFixed(2)}` : 'Price not available'}
            </p>
            <p className="product-sales">
                {product?.sales !== undefined ? `Sales: ${product.sales}` : 'Sales data not available'}
            </p>
            <button
                onClick={() => onAddToCart(product?.id)}
                className="add-to-cart-button"
                disabled={!product?.id}
            >
                Add to Cart
            </button>
            <button
                onClick={() => onViewDetails(product?.id)}
                className="view-details-button"
                disabled={!product?.id}
            >
                View Details
            </button>
        </div>
    );
};

export default ProductCard;