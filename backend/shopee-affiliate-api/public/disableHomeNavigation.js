/**
 * Script to disable navigation away from Sales Martins
 * This will be injected into the sales-martins page
 */
(function() {
    // Execute when DOM is fully loaded
    document.addEventListener('DOMContentLoaded', function() {
        // Find all home buttons/links
        const homeButtons = document.querySelectorAll('a[href="/"], a[href="/home"], a[href="/index"], button.home-button, .navbar-brand');
        
        // Disable them or redirect them to Sales Martins
        homeButtons.forEach(button => {
            button.addEventListener('click', function(event) {
                event.preventDefault();
                event.stopPropagation();
                // Keep the user on the current page or redirect back to sales-martins
                window.location.href = '/sales-martins';
                return false;
            });
            
            // Visual indication that home navigation is disabled
            button.style.opacity = '0.7';
            button.title = 'Navegação para Home desativada';
        });
        
        // Override history navigation
        const pushState = history.pushState;
        history.pushState = function() {
            pushState.apply(history, arguments);
            preventNavigation();
        };
        
        // When back button is pressed
        window.addEventListener('popstate', function() {
            preventNavigation();
        });
        
        function preventNavigation() {
            const currentPath = window.location.pathname;
            if (!currentPath.startsWith('/sales-martins')) {
                console.warn('Redirecionando para /sales-martins para evitar navegação não permitida.');
                window.location.href = '/sales-martins';
            }
        }
        
        // Override window.open
        const originalOpen = window.open;
        window.open = function (url, ...args) {
            if (url && (url.startsWith('/api/') || url.startsWith('/sales-martins') || isAllowedExternalUrl(url))) {
                return originalOpen.apply(window, [url, ...args]);
            }
            console.warn('Tentativa de abrir URL bloqueada:', url);
            window.location.href = '/sales-martins';
            return null;
        };

        function isAllowedExternalUrl(url) {
            try {
                const parsedUrl = new URL(url, window.location.origin);
                return parsedUrl.origin === window.location.origin; // Permitir URLs do mesmo domínio
            } catch (e) {
                return false; // Bloquear URLs inválidas
            }
        }

        console.log('Home navigation disabled for Sales Martins');
    });
})();
