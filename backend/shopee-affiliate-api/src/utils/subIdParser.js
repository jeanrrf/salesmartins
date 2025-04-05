// Utilitário para analisar o campo sub_ids
const parseSubIds = (subIdsString) => {
  try {
    if (!subIdsString) return {};
    
    const subIds = JSON.parse(subIdsString);
    return {
      affiliate: subIds.s1 || '',
      analytics: subIds.s2 || '',
      category: subIds.s3 || '',
      productCode: subIds.s4 || '',
      campaignCode: subIds.s5 || ''
    };
  } catch (error) {
    console.error('Error parsing sub_ids:', error);
    return {};
  }
};
