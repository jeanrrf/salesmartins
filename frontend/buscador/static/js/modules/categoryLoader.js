//###################################################################################################
//# Arquivo: categoryLoader.js                                                                     #
//# Descrição: Este módulo gerencia o carregamento de categorias para o buscador                   #
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
     * Retorna o caminho completo de uma categoria
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
}
