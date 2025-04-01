import { storage, notify } from './utils.js';

const DEFAULT_TEMPLATE = {
    name: 'Template Padrão',
    s1: 'salesmartins',
    s2: 'sentinnellanalytics',
    s3Auto: true,
    s4Auto: true,
    s5Auto: true,
    isDefault: true,
    version: '1.0'
};

export class TemplateManager {
    constructor() {
        this.templates = [DEFAULT_TEMPLATE];
        this.selectedTemplate = DEFAULT_TEMPLATE;
        this.counters = {
            global: 0,
            categories: {}
        };
        this.loadTemplates();
        this.loadCounters();
    }

    loadTemplates() {
        const savedTemplates = storage.get('shopee_templates');
        if (Array.isArray(savedTemplates)) {
            // Always include default template
            this.templates = [
                DEFAULT_TEMPLATE,
                ...savedTemplates.filter(t => !t.isDefault)
            ];
        } else {
            // Initialize with default template
            this.templates = [DEFAULT_TEMPLATE];
            storage.set('shopee_templates', this.templates);
        }
    }

    saveTemplates() {
        storage.set('shopee_templates', this.templates);
    }

    loadCounters() {
        const savedCounters = localStorage.getItem('templateCounters');
        if (savedCounters) {
            this.counters = JSON.parse(savedCounters);
        }
    }

    saveCounters() {
        localStorage.setItem('templateCounters', JSON.stringify(this.counters));
    }

    getNextGlobalCounter() {
        this.counters.global++;
        this.saveCounters();
        return this.counters.global;
    }

    getNextCategoryCounter(categoryId) {
        if (!this.counters.categories[categoryId]) {
            this.counters.categories[categoryId] = 0;
        }
        this.counters.categories[categoryId]++;
        this.saveCounters();
        return this.counters.categories[categoryId];
    }

    getCategorySigla(categoryName) {
        return categoryName
            .split(/[\s-]+/)
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 3);
    }

    generateSubIds(product) {
        const globalCounter = this.getNextGlobalCounter();
        const categoryCounter = this.getNextCategoryCounter(product.categoryId);
        const categorySigla = this.getCategorySigla(product.categoryName);

        return {
            s1: 'salesmartins',
            s2: 'sentinnellanalytics',
            s3: this.prepareSubId3(product.categoryName),
            s4: `SM${globalCounter.toString().padStart(5, '0')}`,
            s5: `SM_${categorySigla}${categoryCounter.toString().padStart(5, '0')}`
        };
    }

    addTemplate(template) {
        if (!template.name) {
            notify.error('Nome do template é obrigatório');
            return false;
        }

        this.templates.push({
            ...template,
            isDefault: false
        });

        this.saveTemplates();
        return true;
    }

    updateTemplate(index, template) {
        if (index < 0 || index >= this.templates.length) {
            notify.error('Template não encontrado');
            return false;
        }

        if (this.templates[index].isDefault) {
            notify.error('Não é possível modificar o template padrão');
            return false;
        }

        this.templates[index] = {
            ...template,
            isDefault: false
        };

        this.saveTemplates();
        return true;
    }

    deleteTemplate(index) {
        if (index < 0 || index >= this.templates.length) {
            notify.error('Template não encontrado');
            return false;
        }

        if (this.templates[index].isDefault) {
            notify.error('Não é possível excluir o template padrão');
            return false;
        }

        this.templates.splice(index, 1);
        this.saveTemplates();
        return true;
    }

    selectTemplate(index) {
        if (index < 0 || index >= this.templates.length) {
            notify.error('Template não encontrado');
            return false;
        }

        this.selectedTemplate = this.templates[index];
        return true;
    }

    validateSubIds(subIds) {
        const validations = [
            // SubID 1 must be 'salesmartins'
            subIds[0] === 'salesmartins',
            // SubID 2 must be 'sentinnellanalytics'
            subIds[1] === 'sentinnellanalytics',
            // SubID 3 must be a valid category name without spaces or special chars
            /^[a-zA-Z0-9_]+$/.test(subIds[2]),
            // SubID 4 must match SM##### pattern
            /^SM\d{5}$/.test(subIds[3]),
            // SubID 5 must match SM_[A-Z]{3}\d{5} pattern
            /^SM_[A-Z]{3}\d{5}$/.test(subIds[4])
        ];

        const validationMessages = [
            'SubID 1 deve ser "salesmartins"',
            'SubID 2 deve ser "sentinnellanalytics"',
            'SubID 3 (categoria) não pode conter espaços ou caracteres especiais',
            'SubID 4 deve seguir o padrão SM##### (exemplo: SM00001)',
            'SubID 5 deve seguir o padrão SM_XXX##### (exemplo: SM_ELE00001)'
        ];

        const failedValidations = validations
            .map((valid, index) => !valid ? validationMessages[index] : null)
            .filter(Boolean);

        return {
            isValid: failedValidations.length === 0,
            errors: failedValidations
        };
    }

    prepareSubId3(categoryName) {
        // Remove espaços e caracteres especiais, converte para lowercase
        return categoryName
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '_')
            .replace(/_+/g, '_') // Remove múltiplos underscores
            .replace(/^_|_$/g, ''); // Remove underscores no início e fim
    }

    getDefaultTemplate() {
        return DEFAULT_TEMPLATE;
    }

    getCurrentTemplate() {
        return this.selectedTemplate;
    }

    getAllTemplates() {
        return this.templates;
    }

    async applyBulkTemplate(products) {
        const results = [];
        const template = this.getCurrentTemplate();
        let generalCounter = 1;
        const categoryCounters = {};

        for (const product of products) {
            try {
                const categoryInfo = product.categoryInfo || { name: 'unknown', sigla: 'UNK' };
                if (!categoryCounters[categoryInfo.sigla]) {
                    categoryCounters[categoryInfo.sigla] = 1;
                }

                const productInfo = {
                    categoryName: categoryInfo.name,
                    categorySigla: categoryInfo.sigla,
                    generalCounter: generalCounter++,
                    categoryCounter: categoryCounters[categoryInfo.sigla]++
                };

                const subIds = this.applyTemplate(productInfo);
                if (subIds) {
                    results.push({
                        productId: product.itemId,
                        success: true,
                        subIds
                    });
                } else {
                    results.push({
                        productId: product.itemId,
                        success: false,
                        error: 'Falha ao aplicar template'
                    });
                }
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

    applyTemplate(productInfo) {
        if (!productInfo) {
            notify.error('Informações do produto são necessárias para aplicar o template');
            return null;
        }

        const template = this.selectedTemplate;
        const subIds = [
            template.s1, // salesmartins (fixed)
            template.s2, // sentinnellanalytics (fixed)
            this.prepareSubId3(productInfo.categoryName), // categoria formatada
            `SM${productInfo.generalCounter.toString().padStart(5, '0')}`, // SM00001
            `SM_${productInfo.categorySigla}${productInfo.categoryCounter.toString().padStart(5, '0')}` // SM_ELE00001
        ];

        const validation = this.validateSubIds(subIds);
        if (!validation.isValid) {
            notify.error('Validação do template falhou:\n' + validation.errors.join('\n'));
            return null;
        }

        return subIds;
    }
}