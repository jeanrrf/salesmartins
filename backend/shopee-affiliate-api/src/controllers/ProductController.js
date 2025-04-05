// Certifique-se de que seu controlador processe todos os campos
const getProducts = async (req, res) => {
  try {
    // Aqui você pode implementar filtros para categoria, busca etc.
    const filters = {};
    
    if (req.query.category) {
      filters.category_name = req.query.category;
    }
    
    if (req.query.search) {
      filters.$or = [
        { shop_name: { $regex: req.query.search, $options: 'i' } },
        { category_name: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    
    const products = await Product.find(filters);
    return res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return res.status(500).json({ error: 'Failed to fetch products' });
  }
};
