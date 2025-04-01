/**
 * Módulo de Verificação de Integridade
 * 
 * Este script verifica se componentes críticos da interface estão presentes
 * para prevenir modificações acidentais que comprometam a funcionalidade.
 */

export class IntegrityCheck {
    constructor() {
        this.criticalElements = [
            // Formulário de busca e elementos relacionados
            { id: 'search-form', description: 'Formulário de busca de produtos' },
            { id: 'keyword', description: 'Campo de palavra-chave' },
            { id: 'sortType', description: 'Seletor de ordenação' },
            { id: 'limit', description: 'Seletor de limite por página' },
            
            // Containers de resultados
            { id: 'products-container', description: 'Container de produtos' },
            { id: 'loading-indicator', description: 'Indicador de carregamento' },
            { id: 'results-count', description: 'Contador de resultados' },
            
            // Elementos de gerenciamento em massa
            { id: 'bulk-category-update', description: 'Seletor de categoria em massa' },
            { id: 'apply-category-update', description: 'Botão para aplicar categoria' },
            { id: 'edit-link-templates', description: 'Botão para editar templates' },
            { id: 'export-data', description: 'Botão para exportar dados' }
        ];
    }

    /**
     * Verifica a presença de todos os elementos críticos na página
     * @returns {Object} Resultado da verificação com elementos ausentes
     */
    checkIntegrity() {
        const missing = [];
        const present = [];
        
        for (const element of this.criticalElements) {
            const el = document.getElementById(element.id);
            if (!el) {
                missing.push(element);
                console.error(`Elemento crítico ausente: ${element.description} (id: ${element.id})`);
            } else {
                present.push(element);
            }
        }
        
        return {
            success: missing.length === 0,
            missing,
            present,
            totalChecked: this.criticalElements.length
        };
    }

    /**
     * Verifica e exibe um alerta caso elementos críticos estejam ausentes
     */
    runCheck() {
        const result = this.checkIntegrity();
        
        if (!result.success) {
            console.warn('⚠️ Verificação de integridade falhou!');
            console.warn(`${result.missing.length} elementos críticos ausentes de ${result.totalChecked} verificados.`);
            
            // Exibe um alerta visual para desenvolvedores
            this.showAlert(result.missing);
        } else {
            console.info('✅ Verificação de integridade passou com sucesso!');
            console.info(`${result.totalChecked} elementos críticos verificados e presentes.`);
        }
        
        return result;
    }
    
    /**
     * Exibe um alerta visual para o desenvolvedor
     * @param {Array} missing Elementos ausentes
     */
    showAlert(missing) {
        // Somente exibir em ambiente de desenvolvimento
        if (process.env.NODE_ENV !== 'production') {
            const alert = document.createElement('div');
            alert.style.position = 'fixed';
            alert.style.top = '0';
            alert.style.left = '0';
            alert.style.right = '0';
            alert.style.backgroundColor = '#ff5757';
            alert.style.color = 'white';
            alert.style.padding = '15px';
            alert.style.zIndex = '9999';
            alert.style.fontFamily = 'monospace';
            alert.style.fontSize = '14px';
            
            alert.innerHTML = `
                <strong>⚠️ ALERTA DE INTEGRIDADE:</strong>
                <p>${missing.length} elementos críticos da interface estão ausentes!</p>
                <ul>
                    ${missing.map(item => `<li>${item.description} (id: ${item.id})</li>`).join('')}
                </ul>
                <p>Verifique o console para mais detalhes.</p>
                <button style="background:#fff;color:#ff5757;border:none;padding:5px 10px;cursor:pointer;float:right">
                    Fechar
                </button>
            `;
            
            document.body.appendChild(alert);
            
            // Permitir fechar o alerta
            const closeButton = alert.querySelector('button');
            closeButton.addEventListener('click', () => {
                alert.remove();
            });
        }
    }
}

// Auto-execução para verificação no carregamento da página
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const checker = new IntegrityCheck();
        checker.runCheck();
    }, 500); // Pequeno atraso para garantir que a página carregou completamente
});