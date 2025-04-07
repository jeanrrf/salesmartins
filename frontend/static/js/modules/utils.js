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
    },

    /**
     * Mostra um toast de notificação
     * @param {string} message - Mensagem a ser exibida
     * @param {string} type - Tipo de notificação (success, error, warning, info)
     */
    showToast: (message, type = 'info') => {
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-white bg-${type} border-0 show`;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');
        toast.setAttribute('aria-atomic', 'true');
        
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;
        
        const toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            const container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
            document.body.appendChild(container);
            container.appendChild(toast);
        } else {
            toastContainer.appendChild(toast);
        }
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 500);
        }, 5000);
    }
};

export const api = {
    async get(endpoint) {
        try {
            const response = await fetch(`${API_URL}${endpoint}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Error fetching ${endpoint}:`, error);
            throw error;
        }
    },

    async post(endpoint, data) {
        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const responseData = await response.json();

            if (!response.ok) {
                throw new Error(responseData.detail || 'Erro desconhecido');
            }

            return responseData;
        } catch (error) {
            console.error('Erro na API:', error);
            throw new Error(`Erro na requisição: ${error.message}`);
        }
    }
};

export const notify = {
    success: (message) => {
        dom.showToast(message, 'success');
    },

    error: (message) => {
        dom.showToast(message, 'danger');
    },

    warning: (message) => {
        dom.showToast(message, 'warning');
    },

    info: (message) => {
        dom.showToast(message, 'info');
    },

    // Especializado para notificar sobre links de afiliados
    affiliateStatus: (stats) => {
        if (stats.total === 0) return;

        let type = 'info';
        let message = '';

        if (stats.withLinks === stats.total) {
            type = 'success';
            message = `✅ ${stats.withLinks}/${stats.total} links de afiliados gerados (100%)`;
        } else if (stats.withLinks === 0) {
            type = 'warning';
            message = `⚠️ Nenhum link de afiliado foi gerado (0/${stats.total})`;
        } else {
            type = 'info';
            message = `ℹ️ ${stats.withLinks}/${stats.total} links de afiliados gerados (${stats.percentage}%)`;
        }

        dom.showToast(message, type);

        // Atualiza o indicador visual, se existir
        updateLinkStatusIndicator(stats);
    }
};

export const handleImageError = (img) => {
    img.onerror = null; // Previne loop infinito
    img.src = '/static/images/no-image.png';
};

function updateLinkStatusIndicator(stats) {
    const indicator = document.getElementById('link-status-indicator');
    if (!indicator) {
        // Criar o indicador se não existir
        createLinkStatusIndicator(stats);
        return;
    }

    // Atualizar o indicador existente
    const progressBar = indicator.querySelector('.progress-bar');
    if (progressBar) {
        progressBar.style.width = `${stats.percentage}%`;
        progressBar.setAttribute('aria-valuenow', stats.percentage);

        // Definir cor da barra baseada na porcentagem
        progressBar.className = 'progress-bar';
        if (stats.percentage === 100) {
            progressBar.classList.add('bg-success');
        } else if (stats.percentage >= 75) {
            progressBar.classList.add('bg-info');
        } else if (stats.percentage >= 25) {
            progressBar.classList.add('bg-warning');
        } else {
            progressBar.classList.add('bg-danger');
        }
    }

    // Atualizar o texto do status
    const statusText = indicator.querySelector('.status-text');
    if (statusText) {
        statusText.textContent = `${stats.withLinks}/${stats.total} links gerados`;
    }
}

function createLinkStatusIndicator(stats) {
    // Verificar se existe uma área para colocar o indicador
    const container = document.querySelector('.card-body') || document.body;
    if (!container) return;

    // Criar o elemento indicador
    const indicator = document.createElement('div');
    indicator.id = 'link-status-indicator';
    indicator.className = 'mt-3';

    // Definir cor da barra baseada na porcentagem
    let progressClass = 'bg-danger';
    if (stats.percentage === 100) {
        progressClass = 'bg-success';
    } else if (stats.percentage >= 75) {
        progressClass = 'bg-info';
    } else if (stats.percentage >= 25) {
        progressClass = 'bg-warning';
    }

    // Criar o HTML do indicador
    indicator.innerHTML = `
        <div class="d-flex justify-content-between align-items-center">
            <small class="status-text">${stats.withLinks}/${stats.total} links gerados</small>
            <small>${stats.percentage}%</small>
        </div>
        <div class="progress" style="height: 10px;">
            <div class="progress-bar ${progressClass}" role="progressbar" 
                style="width: ${stats.percentage}%" 
                aria-valuenow="${stats.percentage}" 
                aria-valuemin="0" 
                aria-valuemax="100"></div>
        </div>
    `;

    // Inserir o indicador na página
    container.prepend(indicator);
}

/**
 * Função que aguarda o backend estar disponível antes de continuar
 * @param {number} maxAttempts Número máximo de tentativas
 * @param {number} interval Intervalo entre tentativas em ms
 * @returns {Promise} Promessa que resolve quando o backend estiver disponível
 */
async function waitForBackend(maxAttempts = 10, interval = 2000) {
    const statusIndicator = document.getElementById('backend-status');
    let attempts = 0;

    return new Promise((resolve, reject) => {
        const checkBackend = async () => {
            try {
                attempts++;
                const response = await fetch('/health');
                
                if (response.ok) {
                    if (statusIndicator) {
                        statusIndicator.innerHTML = '<i class="bi bi-check-circle-fill text-success"></i> Conectado ao servidor';
                        statusIndicator.classList.remove('text-danger');
                        statusIndicator.classList.add('text-success');
                    }
                    console.log('Backend conectado e funcionando!');
                    resolve(true);
                } else {
                    throw new Error('Resposta não OK do backend');
                }
            } catch (error) {
                console.log(`Tentativa ${attempts}/${maxAttempts} - Backend não disponível: ${error.message}`);
                
                if (statusIndicator) {
                    statusIndicator.innerHTML = `<i class="bi bi-exclamation-triangle-fill text-danger"></i> Reconectando ao servidor (${attempts}/${maxAttempts})...`;
                    statusIndicator.classList.remove('text-success');
                    statusIndicator.classList.add('text-danger');
                }
                
                if (attempts >= maxAttempts) {
                    if (statusIndicator) {
                        statusIndicator.innerHTML = '<i class="bi bi-x-circle-fill text-danger"></i> Falha na conexão com o servidor';
                    }
                    reject(new Error(`Não foi possível conectar ao backend após ${maxAttempts} tentativas`));
                } else {
                    setTimeout(checkBackend, interval);
                }
            }
        };
        
        checkBackend();
    });
}

export const fetchCategories = async () => {
    try {
        const response = await fetch(`${API_URL}/categories`);
        if (!response.ok) {
            throw new Error(`Erro ao buscar categorias: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Erro ao buscar categorias:', error);
        throw error;
    }
};

export const fetchProducts = async () => {
    try {
        const response = await fetch(`${API_URL}/db/products`);
        if (!response.ok) {
            throw new Error(`Erro ao buscar produtos: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Erro ao buscar produtos:', error);
        throw error;
    }
};