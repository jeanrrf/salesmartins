// Verifique se as rotas incluem todos os endpoints necessários
router.get('/products', productController.getProducts);
router.get('/products/featured', productController.getFeaturedProducts);
router.get('/products/categories', productController.getCategories);
router.get('/products/category/:categoryName', productController.getProductsByCategory);
router.get('/products/search', productController.searchProducts);
