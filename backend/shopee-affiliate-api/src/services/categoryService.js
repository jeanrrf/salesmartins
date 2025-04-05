// Função para ajustar categoria com base nos dados do produto
const adjustCategory = async (product) => {
  // Extrair e processar informações da categoria do sub_ids
  if (product.sub_ids) {
    try {
      const subIds = JSON.parse(product.sub_ids);
      if (subIds.s3 && subIds.s3.startsWith('categoria_')) {
        const categoryId = subIds.s3.replace('categoria_', '');
        // Aqui você pode mapear o ID da categoria para o nome, se necessário
        return categoryId;
      }
    } catch (error) {
      console.error('Error parsing sub_ids:', error);
    }
  }
  return product.category_name || 'Uncategorized';
};
