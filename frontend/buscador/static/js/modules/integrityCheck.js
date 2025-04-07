//###################################################################################################
//# Arquivo: integrityCheck.js                                                                    #
//# Descrição: Este módulo verifica a integridade dos componentes necessários para o buscador      #
//# Autor: Jean Rosso                                                                              #
//# Data: 28 de março de 2025                                                                      #
//###################################################################################################

export class IntegrityCheck {
    constructor() {
        this.requiredElements = [
            {
                id: 'search-form',
                type: 'form',
                description: 'Formulário de busca'
            },
            {
                id: 'search-query',
                type: 'input',
                description: 'Campo de busca'
            },
            {
                id: 'products-container',
                type: 'div',
                description: 'Container de produtos'
            },
            {
                id: 'toast-container',
                type: 'div',
                description: 'Container de notificações'
            }
        ];
        
        this.requiredAPIs = [
            {
                endpoint: '/db/products',
                method: 'GET',
                description: 'API de produtos'
            },
            {
                endpoint: '/categoria',
                method: 'GET',
                description: 'API de categorias'
            },
            {
                endpoint: '/search',
                method: 'POST',
                description: 'API de busca'
            }
        ];
    }

    // Verifica se todos os elementos HTML necessários existem
    checkRequiredElements() {
        const missingElements = [];
        
        for (const element of this.requiredElements) {
            const el = document.getElementById(element.id);
            if (!el || el.tagName.toLowerCase() !== element.type) {
                missingElements.push(element);
            }
        }
        
        return {
            success: missingElements.length === 0,
            missingElements
        };
    }

    // Verifica se o backend está acessível
    async checkBackend() {
        try {
            const response = await fetch('/health');
            return {
                success: response.ok,
                status: response.status,
                message: response.ok ? 'Backend disponível' : 'Backend indisponível'
            };
        } catch (error) {
            return {
                success: false,
                status: 0,
                message: `Backend inacessível: ${error.message}`
            };
        }
    }

    // Executa todas as verificações
    runCheck() {
        const elementsCheck = this.checkRequiredElements();
        
        // Criar container de toast se ele não existir
        if (elementsCheck.missingElements.find(e => e.id === 'toast-container')) {
            const container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
            document.body.appendChild(container);
            
            // Remover este elemento da lista de elementos faltantes
            elementsCheck.missingElements = elementsCheck.missingElements.filter(e => e.id !== 'toast-container');
            elementsCheck.success = elementsCheck.missingElements.length === 0;
        }
        
        return {
            success: elementsCheck.success,
            elementsCheck,
            criticalFail: elementsCheck.missingElements.some(e => e.id === 'products-container')
        };
    }
    
    // Verifica se as APIs estão disponíveis
    async checkAPIs() {
        const results = [];
        
        for (const api of this.requiredAPIs) {
            try {
                const response = await fetch(api.endpoint, { 
                    method: api.method === 'GET' ? 'HEAD' : 'OPTIONS' 
                });
                
                results.push({
                    endpoint: api.endpoint,
                    success: response.ok,
                    status: response.status,
                    description: api.description
                });
            } catch (error) {
                results.push({
                    endpoint: api.endpoint,
                    success: false,
                    status: 0,
                    description: api.description,
                    error: error.message
                });
            }
        }
        
        return {
            success: results.every(r => r.success),
            results
        };
    }
}