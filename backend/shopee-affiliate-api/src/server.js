const express = require('express');
const cors = require('cors');
const config = require('./config/database');
const ModuleLoader = require('./utils/moduleLoader');
const injectScripts = require('./middleware/injectScripts');
const disableHeaderNavigation = require('./middleware/disableHeaderNavigation');
const path = require('path');

// Initialize express app
const app = express();
app.use(express.json());
app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Register middleware
ModuleLoader.registerGlobalMiddleware(app, injectScripts);
ModuleLoader.registerGlobalMiddleware(app, disableHeaderNavigation);

// Always load core routes (Sales Martins and basic data access)
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/affiliate', require('./routes/affiliateRoutes'));

// Configuração para acesso público total sem autenticação
ModuleLoader.registerRoutesIfEnabled(app, 'adminPanel', (app) => {
    app.use('/api/admin', require('./routes/adminRoutes'));
});

ModuleLoader.registerRoutesIfEnabled(app, 'searchModule', (app) => {
    app.use('/api/search', require('./routes/searchRoutes'));
});

// Rota bypass para simular autenticação (retorna sempre positivo)
app.post('/api/auth/login', (req, res) => {
    res.json({
        success: true,
        user: {
            id: 1,
            name: 'Admin',
            email: 'admin@example.com',
            role: 'admin'
        },
        token: 'fake-jwt-token'
    });
});

// Verificação de token retorna sempre autenticado
app.post('/api/auth/verify', (req, res) => {
    res.json({
        success: true,
        isValid: true,
        user: {
            id: 1,
            name: 'Admin',
            email: 'admin@example.com',
            role: 'admin'
        }
    });
});

// Simple environment info endpoint
app.get('/api/environment', (req, res) => {
    res.json({
        environment: 'development',
        modules: ['salesMartins', 'productViewer'],
        status: 'API funcionando sem autenticação',
        publicAccess: true
    });
});

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../frontend-react/build')));
}

// Force redirect any access to root to sales-martins
app.get('/', (req, res) => {
    res.redirect('/sales-martins');
});

// Explicitly handle home route to redirect to sales-martins
// This catches any attempt to navigate to the home page from Sales Martins
app.get('/home', (req, res) => {
    res.redirect('/sales-martins');
});

// Handle common nav paths that might be used by the home button
app.get(['/index', '/main', '/inicio', '/dashboard', '/homepage', '/landing'], (req, res) => {
    res.redirect('/sales-martins');
});

// Disable navigation away from sales-martins by adding a middleware that checks referrer
app.use((req, res, next) => {
    // Only apply to GET requests that aren't API calls or static files
    if (req.method === 'GET' &&
        !req.path.startsWith('/api/') &&
        !req.path.includes('.') &&
        !req.path.startsWith('/sales-martins')) {

        // Always redirect dashboard attempts
        if (req.path.startsWith('/dashboard') || req.path === '/dashboard') {
            return res.redirect('/sales-martins');
        }

        const referer = req.get('Referer');
        // If the request comes from sales-martins page, redirect back to it
        if (referer && referer.includes('/sales-martins')) {
            return res.redirect('/sales-martins');
        }
    }
    next();
});

// Simplificação: verificar se o caminho é para API ou recursos estáticos de uma vez
app.get('*', (req, res, next) => {
    // Permitir requisições da API e arquivos estáticos passarem sem redirecionamento
    // Verifica se começa com /api/ ou se contém um ponto (indicando arquivo estático)
    // ou se é relacionado à rota sales-martins
    if (req.path.startsWith('/api/') ||
        req.path.includes('.') ||
        req.path === '/sales-martins' ||
        req.path.startsWith('/sales-martins/')) {
        return next();
    }

    // Redirecionar todas as outras requisições para sales-martins
    res.redirect('/sales-martins');
});

// Special handling for sales-martins routes to work with React Router
app.get('/sales-martins/*', (req, res) => {
    // In production, serve the index.html for React Router to handle the route
    if (process.env.NODE_ENV === 'production') {
        res.sendFile(path.join(__dirname, '../frontend-react/build/index.html'));
    } else {
        // In development, redirect to the development server
        res.redirect(`http://localhost:3000${req.path}`);
    }
});

// For production, make sure to serve the Sales Martins page directly
if (process.env.NODE_ENV === 'production') {
    app.get('/sales-martins', (req, res) => {
        res.sendFile(path.join(__dirname, '../frontend-react/build/index.html'));
    });
} else {
    // In development mode, redirect sales-martins to the React development server
    app.get('/sales-martins', (req, res) => {
        res.redirect('http://localhost:3000/sales-martins');
    });
}

// Inject extra script to disable dashboard button in frontend
app.use((req, res, next) => {
    if (req.path === '/sales-martins' || req.path.startsWith('/sales-martins/')) {
        // Store the original send function
        const originalSend = res.send;

        res.send = function (body) {
            // Only process HTML responses
            if (typeof body === 'string' && body.includes('</body>')) {
                // Add script to disable dashboard button
                const disableScript = `
                <script>
                    document.addEventListener('DOMContentLoaded', function() {
                        // Remove or disable header navigation buttons
                        function disableNavigation() {
                            // Target common header button selectors
                            const headerButtons = document.querySelectorAll(
                                'header a, header button, .header a, .header button, ' + 
                                '.navbar a, .navbar button, .nav a, .nav button, ' +
                                '.navigation a, .navigation button, ' +
                                'a[href="/dashboard"], button[data-target="/dashboard"], ' + 
                                '.dashboard-link, .home-link, .admin-link'
                            );
                            
                            headerButtons.forEach(btn => {
                                if (!btn.href?.includes('/sales-martins') && 
                                    !btn.getAttribute('data-target')?.includes('/sales-martins')) {
                                    // Disable the button or link
                                    btn.style.display = 'none';
                                    btn.addEventListener('click', function(e) {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        return false;
                                    });
                                }
                            });
                        }
                        
                        // Run immediately and also after any React/DOM updates
                        disableNavigation();
                        setInterval(disableNavigation, 1000);
                    });
                </script>`;

                body = body.replace('</body>', disableScript + '</body>');
            }

            // Call the original function
            return originalSend.call(this, body);
        };
    }
    next();
});

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Servidor rodando em modo ${process.env.NODE_ENV || 'DESENVOLVIMENTO'} na porta ${PORT}`);
    console.log('Sales Martins - Exibidor de Produtos ativo (acesso direto sem autenticação)');
    console.log('Todas as requisições serão redirecionadas para /sales-martins');
});