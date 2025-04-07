// ###################################################################################################
// Arquivo: linkGenerator.js                                                                       #
// Descrição: Este script gera links de afiliados com base em templates e categorias.              #
// Autor: Jean Rosso                                                                              #
// Data: 28 de março de 2025                                                                      #
// ###################################################################################################

import { api, notify } from './utils.js';

export class LinkGenerator {
    constructor(templateManager, categoryManager) {
        this.templateManager = templateManager;
        this.categoryManager = categoryManager;
    }

    async generateLink(offerLink, subIds) {
        if (!offerLink) {
            throw new Error('Link de oferta é necessário');
        }

        if (!Array.isArray(subIds) || subIds.length !== 5) {
            throw new Error('SubIDs inválidos');
        }

        // Criar link com SubIDs
        const url = new URL(offerLink);
        url.searchParams.set('subids', subIds.join(','));
        
        return url.toString();
    }

    async generateBulkLinks(products) {
        const results = [];
        
        for (const product of products) {
            try {
                const categoryInfo = this.categoryManager.getCategoryInfo(product);
                const subIds = this.templateManager.generateSubIds({
                    ...product,
                    categoryName: categoryInfo.name,
                    categoryId: categoryInfo.id
                });

                const link = await this.generateLink(product.offerLink, Object.values(subIds));
                
                results.push({
                    productId: product.itemId,
                    success: true,
                    link,
                    subIds
                });
            } catch (error) {
                results.push({
                    productId: product.itemId,
                    success: false,
                    error: error.message
                });
            }
        }
        
        return results;
    }
}