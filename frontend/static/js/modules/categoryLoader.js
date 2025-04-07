//###################################################################################################
//# Arquivo: categoryLoader.js                                                                     #
//# Descrição: Este módulo gerencia o carregamento e manipulação de categorias                     #
//# Autor: Jean Rosso                                                                              #
//# Data: 28 de março de 2025                                                                      #
//###################################################################################################

import { api, notify } from './utils.js';

export class CategoryLoader {
    constructor() {
        this.categories = [];
        this.subCategories = {};
        this.subCategoriesLevel3 = {};
        this.isLoading = false;
    }

    /**
     * Inicializa o carregamento de todas as categorias
     */
    async initialize() {
        try {
            this.isLoading = true;
            
            // Carregar categorias principais (nível 1)
            await this.loadMainCategories();
            
            // Carregar subcategorias (nível 2)
            await this.loadSubCategories();
            
            // Carregar subcategorias de nível 3
            await this.loadLevel3Categories();
            
            this.isLoading = false;
            return true;
        } catch (error) {
            console.error('Erro ao inicializar categorias:', error);
            notify.error('Falha ao carregar categorias. Algumas funções podem não estar disponíveis.');
            this.isLoading = false;
            return false;
        }
    }

    /**
     * Carrega as categorias principais (nível 1)
     */
    async loadMainCategories() {
        try {
            const response = await fetch('http://localhost:8001/categoria');
            if (!response.ok) {
                throw new Error(`Erro ao carregar categorias: ${response.status}`);
            }
            
            this.categories = await response.json();
            console.log('Categorias principais carregadas:', this.categories.length);
            return this.categories;
        } catch (error) {
            console.error('Erro ao carregar categorias principais:', error);
            throw error;
        }
    }

    /**
     * Carrega as subcategorias (nível 2)
     */
    async loadSubCategories() {
        try {
            const response = await fetch('http://localhost:8001/subcategorias');
            if (!response.ok) {
                throw new Error(`Erro ao carregar subcategorias: ${response.status}`);
            }
            
            const subCats = await response.json();
            
            // Organizar subcategorias por categoria pai
            this.subCategories = subCats.reduce((acc, subCat) => {
                if (!acc[subCat.parent_id]) {
                    acc[subCat.parent_id] = [];
                }
                acc[subCat.parent_id].push(subCat);
                return acc;
            }, {});
            
            console.log('Subcategorias carregadas para', Object.keys(this.subCategories).length, 'categorias principais');
            return this.subCategories;
        } catch (error) {
            console.error('Erro ao carregar subcategorias:', error);
            throw error;
        }
    }

    /**
     * Carrega as subcategorias de nível 3
     */
    async loadLevel3Categories() {
        try {
            const response = await fetch('http://localhost:8001/subcategorias/nivel3');
            if (!response.ok) {
                throw new Error(`Erro ao carregar subcategorias nível 3: ${response.status}`);
            }
            
            const level3Cats = await response.json();
            
            // Organizar subcategorias nível 3 por categoria pai (nível 2)
            this.subCategoriesLevel3 = level3Cats.reduce((acc, subCat) => {
                if (!acc[subCat.parent_id]) {
                    acc[subCat.parent_id] = [];
                }
                acc[subCat.parent_id].push(subCat);
                return acc;
            }, {});
            
            console.log('Subcategorias nível 3 carregadas para', Object.keys(this.subCategoriesLevel3).length, 'subcategorias');
            return this.subCategoriesLevel3;
        } catch (error) {
            console.error('Erro ao carregar subcategorias nível 3:', error);
            throw error;
        }
    }

    /**
     * Retorna todas as categorias em formato de options para select
     */
    getCategorySelectOptions() {
        let options = '<option value="">Todas as categorias</option>';
        
        // Adicionar categorias principais
        this.categories.forEach(category => {
            options += `<option value="${category.id}" data-sigla="${category.sigla}">${category.name}</option>`;
            
            // Adicionar subcategorias (nível 2) se existirem
            if (this.subCategories[category.id]) {
                this.subCategories[category.id].forEach(subCat => {
                    options += `<option value="${subCat.id}" data-sigla="${subCat.sigla}" data-parent="${category.id}">-- ${subCat.name}</option>`;
                    
                    // Adicionar subcategorias nível 3 se existirem
                    if (this.subCategoriesLevel3[subCat.id]) {
                        this.subCategoriesLevel3[subCat.id].forEach(subCatL3 => {
                            options += `<option value="${subCatL3.id}" data-sigla="${subCatL3.sigla}" data-parent="${subCat.id}">---- ${subCatL3.name}</option>`;
                        });
                    }
                });
            }
        });
        
        return options;
    }

    /**
     * Busca os detalhes de uma categoria por ID
     */
    getCategoryById(categoryId) {
        // Procurar nas categorias principais
        let category = this.categories.find(cat => cat.id === categoryId);
        if (category) return category;
        
        // Procurar nas subcategorias nível 2
        for (const parentId in this.subCategories) {
            category = this.subCategories[parentId].find(subCat => subCat.id === categoryId);
            if (category) return category;
        }
        
        // Procurar nas subcategorias nível 3
        for (const parentId in this.subCategoriesLevel3) {
            category = this.subCategoriesLevel3[parentId].find(subCat => subCat.id === categoryId);
            if (category) return category;
        }
        
        return null;
    }

    /**
     * Retorna os nomes completos das categorias, incluindo os pais
     * Por exemplo: "Eletrônicos > Smartphones > Android"
     */
    getCategoryFullPath(categoryId) {
        const category = this.getCategoryById(categoryId);
        if (!category) return 'Categoria Desconhecida';
        
        if (category.level === 1) {
            return category.name;
        }
        
        if (category.level === 2) {
            const parentCategory = this.getCategoryById(category.parent_id);
            return `${parentCategory?.name || 'Desconhecido'} > ${category.name}`;
        }
        
        if (category.level === 3) {
            const parentCategory = this.getCategoryById(category.parent_id); // nível 2
            if (parentCategory) {
                const grandParentCategory = this.getCategoryById(parentCategory.parent_id); // nível 1
                return `${grandParentCategory?.name || 'Desconhecido'} > ${parentCategory.name} > ${category.name}`;
            }
            return `Desconhecido > Desconhecido > ${category.name}`;
        }
        
        return category.name;
    }

    /**
     * Verifica e repara as categorias dos produtos
     */
    async repairProductCategories(products) {
        const updatedProducts = [];
        const failedProducts = [];
        
        for (const product of products) {
            try {
                // Verifica se precisa de reparo
                if (!product.category_id || !this.getCategoryById(product.category_id)) {
                    // Tenta encontrar a categoria adequada com base em palavras-chave
                    const newCategory = this.findCategoryByKeywords(product.name + ' ' + (product.description || ''));
                    
                    if (newCategory) {
                        // Atualizar produto com a nova categoria
                        const updatedProduct = await api.put(`/db/products/${product.id}`, {
                            ...product,
                            category_id: newCategory.id,
                            category_name: newCategory.name,
                            category_sigla: newCategory.sigla
                        });
                        
                        updatedProducts.push(updatedProduct);
                    } else {
                        failedProducts.push(product);
                    }
                }
            } catch (error) {
                console.error(`Erro ao reparar categoria do produto ${product.id}:`, error);
                failedProducts.push(product);
            }
        }
        
        return { updatedProducts, failedProducts };
    }

    /**
     * Encontra a categoria mais adequada com base em palavras-chave
     */
    findCategoryByKeywords(text) {
        text = text.toLowerCase();
        let bestMatch = null;
        let highestScore = 0;
        
        // Verificar categorias principais
        this.categories.forEach(category => {
            const score = this.calculateKeywordMatchScore(text, category.keywords);
            if (score > highestScore) {
                highestScore = score;
                bestMatch = category;
            }
        });
        
        // Verificar subcategorias apenas se o score não for alto o suficiente
        if (highestScore < 3) {
            // Verificar subcategorias nível 2
            for (const parentId in this.subCategories) {
                this.subCategories[parentId].forEach(subCat => {
                    const score = this.calculateKeywordMatchScore(text, subCat.keywords);
                    if (score > highestScore) {
                        highestScore = score;
                        bestMatch = subCat;
                    }
                });
            }
            
            // Verificar subcategorias nível 3 se ainda não tiver um match bom
            if (highestScore < 4) {
                for (const parentId in this.subCategoriesLevel3) {
                    this.subCategoriesLevel3[parentId].forEach(subCat => {
                        const score = this.calculateKeywordMatchScore(text, subCat.keywords);
                        if (score > highestScore) {
                            highestScore = score;
                            bestMatch = subCat;
                        }
                    });
                }
            }
        }
        
        return bestMatch;
    }

    /**
     * Calcula a pontuação de correspondência de palavras-chave
     */
    calculateKeywordMatchScore(text, keywords) {
        let score = 0;
        
        keywords.forEach(keyword => {
            if (text.includes(keyword.toLowerCase())) {
                // Palavras-chave exatas valem mais
                score += 2;
                
                // Palavras-chave no início do texto valem mais
                if (text.indexOf(keyword.toLowerCase()) < 20) {
                    score += 1;
                }
            }
        });
        
        return score;
    }
}
