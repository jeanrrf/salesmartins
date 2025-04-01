import { dom } from './utils.js';

export class UIManager {
    constructor() {
        this.modals = {};
        this.initializeModals();
    }

    initializeModals() {
        // Initialize Bootstrap modals
        const modalElements = document.querySelectorAll('.modal');
        modalElements.forEach(element => {
            const modalId = element.id;
            this.modals[modalId] = new bootstrap.Modal(element);

            // Add event listeners for modal cleanup
            element.addEventListener('hidden.bs.modal', () => {
                this.clearModalForm(modalId);
            });
        });
    }

    showModal(modalId, data = {}) {
        const modal = this.modals[modalId];
        if (!modal) return;

        this.prepareModalContent(modalId, data);
        modal.show();
    }

    hideModal(modalId) {
        const modal = this.modals[modalId];
        if (!modal) return;
        modal.hide();
    }

    prepareModalContent(modalId, data) {
        switch (modalId) {
            case 'link-modal':
                this.prepareLinkModal(data);
                break;
            case 'category-adjust-modal':
                this.prepareCategoryModal(data);
                break;
            case 'category-selection-modal':
                this.prepareCategorySelectionModal(data);
                break;
        }
    }

    prepareLinkModal(data) {
        const { product } = data;
        if (!product) return;

        // Update product info section
        const infoContainer = document.getElementById('link-product-info');
        if (infoContainer) {
            infoContainer.innerHTML = `
                <div class="d-flex align-items-center">
                    <img src="${product.imageUrl}" alt="${product.productName}" 
                         style="width: 80px; height: 80px; object-fit: contain;" class="me-3">
                    <div>
                        <h5>${product.productName}</h5>
                        <p class="mb-1">Categoria: ${product.categoryName}</p>
                        <p class="mb-0">Loja: ${product.shopName}</p>
                    </div>
                </div>
            `;
        }

        // Reset form and errors
        dom.hide('link-error');
        dom.hide('generated-link-area');
        dom.hide('link-loading');

        // Update hidden fields
        document.getElementById('product-url').value = product.offerLink || '';
        document.getElementById('product-category').value = product.categoryName || '';
        document.getElementById('product-category-id').value = product.categoryId || '';
    }

    prepareCategoryModal(data) {
        const { product, categories } = data;
        if (!product) return;

        // Update product info
        const infoContainer = document.getElementById('adjust-product-info');
        if (infoContainer) {
            infoContainer.innerHTML = `
                <div class="d-flex align-items-center">
                    <img src="${product.imageUrl}" alt="${product.productName}" 
                         style="width: 80px; height: 80px; object-fit: contain;" class="me-3">
                    <div>
                        <h5>${product.productName}</h5>
                        <p class="mb-0">Loja: ${product.shopName}</p>
                    </div>
                </div>
            `;
        }

        // Update form fields
        document.getElementById('adjust-product-id').value = product.itemId;
        document.getElementById('current-category').value = product.categoryName;

        // Update category select options
        const categorySelect = document.getElementById('new-category');
        if (categorySelect && categories) {
            categorySelect.innerHTML = categories.map(cat => 
                `<option value="${cat.id}" ${cat.id === product.categoryId ? 'selected' : ''}>
                    ${cat.name}
                </option>`
            ).join('');
        }

        // Clear reason field
        document.getElementById('adjustment-reason').value = '';
    }

    prepareCategorySelectionModal(data) {
        const { categories } = data;
        const categorySelect = document.getElementById('category-selection');
        if (categorySelect && categories) {
            categorySelect.innerHTML = categories.map(cat => 
                `<option value="${cat.id}">${cat.name}</option>`
            ).join('');
        }
    }

    async showCategorySelectionModal(categories) {
        this.prepareCategorySelectionModal({ categories });
        return new Promise((resolve) => {
            const modal = this.modals['category-selection-modal'];
            const confirmButton = document.getElementById('confirm-category-selection');

            const onConfirm = () => {
                const selectedCategoryId = document.getElementById('category-selection').value;
                const selectedCategory = categories.find(cat => cat.id === selectedCategoryId);
                confirmButton.removeEventListener('click', onConfirm);
                modal.hide();
                resolve(selectedCategory);
            };

            confirmButton.addEventListener('click', onConfirm);
            modal.show();
        });
    }

    clearModalForm(modalId) {
        const form = document.querySelector(`#${modalId} form`);
        if (form) form.reset();

        // Clear any error messages or loading states
        const errorElements = document.querySelectorAll(`#${modalId} .alert-danger`);
        errorElements.forEach(el => el.style.display = 'none');

        const loadingElements = document.querySelectorAll(`#${modalId} .loading-spinner`);
        loadingElements.forEach(el => el.style.display = 'none');
    }

    showLoading(modalId) {
        const loadingElement = document.querySelector(`#${modalId} .loading-spinner`);
        if (loadingElement) loadingElement.style.display = 'block';
    }

    hideLoading(modalId) {
        const loadingElement = document.querySelector(`#${modalId} .loading-spinner`);
        if (loadingElement) loadingElement.style.display = 'none';
    }

    showError(modalId, message) {
        const errorElement = document.querySelector(`#${modalId} .alert-danger`);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    }

    showSuccess(modalId, message) {
        const successElement = document.querySelector(`#${modalId} .alert-success`);
        if (successElement) {
            successElement.textContent = message;
            successElement.style.display = 'block';
            setTimeout(() => {
                successElement.style.display = 'none';
            }, 3000);
        }
    }

    // Add clipboard functionality
    copyToClipboard(text) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text)
                .then(() => this.showSuccess('link-modal', 'Link copiado para a área de transferência!'))
                .catch(err => this.showError('link-modal', 'Erro ao copiar link: ' + err.message));
        } else {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            try {
                document.execCommand('copy');
                this.showSuccess('link-modal', 'Link copiado para a área de transferência!');
            } catch (err) {
                this.showError('link-modal', 'Erro ao copiar link: ' + err.message);
            }
            document.body.removeChild(textarea);
        }
    }

    // Toast notification system
    showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            this.createToastContainer();
        }

        const toast = document.createElement('div');
        toast.className = `toast align-items-center border-0 bg-${type}`;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');
        toast.setAttribute('aria-atomic', 'true');

        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body text-white">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" 
                        data-bs-dismiss="toast" aria-label="Fechar"></button>
            </div>
        `;

        document.getElementById('toast-container').appendChild(toast);
        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();

        // Remove toast after it's hidden
        toast.addEventListener('hidden.bs.toast', () => {
            toast.remove();
        });
    }

    createToastContainer() {
        const container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        container.style.zIndex = '1050';
        document.body.appendChild(container);
    }
}