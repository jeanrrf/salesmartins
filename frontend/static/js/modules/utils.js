// Se estiver em produção (Render), use a URL do Render, senão use localhost
export const API_URL = window.location.hostname === 'salesmartins.onrender.com' 
    ? 'https://salesmartins.onrender.com' 
    : 'http://localhost:8001';

export const formatters = {
    currency: (value) => {
        if (!value) return 'N/A';
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(parseFloat(value));
    },

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

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(`API Error: ${response.status} - ${errorData?.detail || 'Erro desconhecido'}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }
};

export const notify = {
    success: (message) => {
        showToast(message, 'success');
    },

    error: (message) => {
        showToast(message, 'danger');
    },

    warning: (message) => {
        showToast(message, 'warning');
    },

    info: (message) => {
        showToast(message, 'info');
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

        showToast(message, type);

        // Atualiza o indicador visual, se existir
        updateLinkStatusIndicator(stats);
    }
};

function showToast(message, type = 'info') {
    // Verificar se já existe um container de toasts
    let toastContainer = document.getElementById('toast-container');

    if (!toastContainer) {
        // Criar o container de toasts
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        toastContainer.style.zIndex = '1050';
        document.body.appendChild(toastContainer);
    }

    // Criar o toast
    const toastEl = document.createElement('div');
    toastEl.className = `toast align-items-center text-white bg-${type} border-0`;
    toastEl.role = 'alert';
    toastEl.ariaLive = 'assertive';
    toastEl.ariaAtomic = 'true';

    // Conteúdo do toast
    toastEl.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">${message}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Fechar"></button>
        </div>
    `;

    // Adicionar o toast ao container
    toastContainer.appendChild(toastEl);

    // Inicializar o toast do Bootstrap
    const toast = new bootstrap.Toast(toastEl, {
        autohide: true,
        delay: 5000
    });

    // Exibir o toast
    toast.show();

    // Remover o toast quando fechado
    toastEl.addEventListener('hidden.bs.toast', () => {
        toastEl.remove();
    });

    // Log no console
    console.log(`[${type.toUpperCase()}] ${message}`);
}

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

async function waitForBackend(url, timeout = 30000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
        try {
            const response = await fetch(url);
            if (response.ok) {
                console.log("Backend is ready.");
                return true;
            }
        } catch (error) {
            console.warn("Waiting for backend...");
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    console.error("Backend did not respond within the timeout period.");
    return false;
}

// Example usage in your frontend initialization
waitForBackend("http://localhost:8001").then(isReady => {
    if (!isReady) {
        alert("Backend server is not available. Please try again later.");
    }
});

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