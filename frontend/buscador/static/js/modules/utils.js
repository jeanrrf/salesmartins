// ###################################################################################################
// Arquivo: utils.js                                                                             #
// Descrição: Este script contém funções utilitárias e configurações globais.                      #
// Autor: Jean Rosso                                                                              #
// Data: 28 de março de 2025                                                                      #
// ###################################################################################################

// Se estiver em produção (Render), use a URL do Render, senão use localhost
export const API_URL = window.location.hostname === 'salesmartins.onrender.com' 
    ? 'https://salesmartins.onrender.com' 
    : 'http://localhost:8001';

export const formatters = {
    /**
     * Formata valores monetários para exibição
     * @param {number} value - Valor a ser formatado
     * @returns {string} - Valor formatado como moeda brasileira
     */
    currency: (value) => {
        if (!value) return 'N/A';
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(parseFloat(value));
    },

    /**
     * Formata valores percentuais para exibição
     * @param {number} value - Valor decimal a ser formatado (ex: 0.25)
     * @returns {string} - Valor formatado como porcentagem (ex: 25.00%)
     */
    percent: (value) => {
        if (!value) return 'N/A';
        return (parseFloat(value) * 100).toFixed(2) + '%';
    }
};

export const storage = {
    get: (key) => {
        try {
            return JSON.parse(localStorage.getItem(key));
        } catch {
            return null;
        }
    },

    set: (key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch {
            return false;
        }
    }
};

/**
 * Centralizando funções de manipulação de DOM para evitar duplicação
 */
export const dom = {
    show: (element) => {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }
        if (element) {
            element.style.display = 'block';
        }
    },

    hide: (element) => {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }
        if (element) {
            element.style.display = 'none';
        }
    },

    toggle: (element, show) => {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }
        if (element) {
            element.style.display = show ? 'block' : 'none';
        }
    }
};

// API handling utility
export const api = {
    baseUrl: API_URL,
    
    async get(endpoint, params = {}) {
        try {
            const url = new URL(`${this.baseUrl}${endpoint}`);
            Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
            
            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error(`API GET Error (${endpoint}):`, error);
            throw error;
        }
    },
    
    async post(endpoint, data = {}) {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error(`API POST Error (${endpoint}):`, error);
            throw error;
        }
    }
};

// Notificações
export const notify = {
    show(message, type = 'info', duration = 3000) {
        const toastContainer = document.getElementById('toast-container') || this.createToastContainer();
        
        const toast = document.createElement('div');
        toast.className = `toast-message alert alert-${type} shadow`;
        toast.innerHTML = message;
        toast.style.animation = 'fadeIn 0.3s ease-in';
        
        toastContainer.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'fadeOut 0.3s ease-out';
            setTimeout(() => {
                if (toastContainer.contains(toast)) {
                    toastContainer.removeChild(toast);
                }
            }, 300);
        }, duration);
    },
    
    createToastContainer() {
        const container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        container.style.zIndex = '9999';
        document.body.appendChild(container);
        return container;
    },
    
    success(message, duration = 3000) {
        this.show(message, 'success', duration);
    },
    
    error(message, duration = 5000) {
        this.show(message, 'danger', duration);
    },
    
    info(message, duration = 3000) {
        this.show(message, 'info', duration);
    },
    
    warning(message, duration = 4000) {
        this.show(message, 'warning', duration);
    }
};