/**
 * notification.js
 * Sistema de notificações unificado para o SENTINNELL_GERADOR
 * Fornece métodos para exibir diferentes tipos de notificações
 */

export class NotificationSystem {
    constructor() {
        this.toastContainer = null;
        this.initializeContainer();
    }
    
    initializeContainer() {
        // Verifica se já existe um container
        this.toastContainer = document.getElementById('toast-container');
        
        if (!this.toastContainer) {
            // Cria o container se não existir
            this.toastContainer = document.createElement('div');
            this.toastContainer.id = 'toast-container';
            this.toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
            this.toastContainer.style.zIndex = '1050';
            document.body.appendChild(this.toastContainer);
        }
    }
    
    showToast(message, type = 'info', duration = 3000) {
        // Regenerar o container caso tenha sido removido
        this.initializeContainer();
        
        // Criar o elemento toast
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-white bg-${type} border-0`;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');
        toast.setAttribute('aria-atomic', 'true');
        
        // Adicionar conteúdo ao toast
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        `;
        
        // Adicionar ao container
        this.toastContainer.appendChild(toast);
        
        // Inicializar o toast usando Bootstrap
        const bsToast = new bootstrap.Toast(toast, {
            autohide: true,
            delay: duration
        });
        
        // Exibir o toast
        bsToast.show();
        
        // Remover o elemento do DOM quando fechado
        toast.addEventListener('hidden.bs.toast', () => {
            toast.remove();
        });
    }
    
    success(message, duration = 3000) {
        this.showToast(message, 'success', duration);
    }
    
    error(message, duration = 5000) {
        this.showToast(message, 'danger', duration);
    }
    
    warning(message, duration = 4000) {
        this.showToast(message, 'warning', duration);
    }
    
    info(message, duration = 3000) {
        this.showToast(message, 'info', duration);
    }
    
    // Especializado para notificar sobre links de afiliados
    affiliateStatus(stats) {
        if (stats.total === 0) return;

        let type = 'info';
        let message = '';

        if (stats.withLinks === stats.total) {
            type = 'success';
            message = `Todos os ${stats.total} produtos possuem links de afiliados.`;
        } else if (stats.withLinks === 0) {
            type = 'warning';
            message = `Nenhum dos ${stats.total} produtos possui links de afiliados.`;
        } else {
            type = 'info';
            message = `${stats.withLinks} de ${stats.total} produtos possuem links de afiliados.`;
        }

        this.showToast(message, type);
    }
}

// Exportar uma instância pronta para uso
export const notify = new NotificationSystem();
