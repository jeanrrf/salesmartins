// Serviço para criar vitrines de produtos
const getShowcase = async () => {
  try {
    const showcase = {};
    
    // Vitrine de produtos populares (com base nas vendas)
    showcase.popular = await Product.find()
      .sort({ sales: -1 })
      .limit(10);
    
    // Vitrine de produtos com melhor avaliação
    showcase.topRated = await Product.find()
      .sort({ rating_star: -1 })
      .limit(10);
    
    // Vitrine de produtos com maior desconto
    showcase.biggestDiscounts = await Product.find()
      .sort({ price_discount_rate: -1 })
      .limit(10);
    
    return showcase;
  } catch (error) {
    console.error('Error creating showcase:', error);
    throw error;
  }
};
