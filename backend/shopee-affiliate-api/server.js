const express = require('express');
const cors = require('cors');
const config = require('./src/config/database');
const ModuleLoader = require('./src/utils/moduleLoader');
const path = require('path');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Always load core routes (Sales Martins and basic data access)
app.use('/api/products', require('./src/routes/productRoutes'));
app.use('/api/affiliate', require('./src/routes/affiliateRoutes'));

// Configuração para acesso público total sem autenticação
ModuleLoader.registerRoutesIfEnabled(app, 'adminPanel', (app) => {
  app.use('/api/admin', require('./src/routes/adminRoutes'));
});

ModuleLoader.registerRoutesIfEnabled(app, 'searchModule', (app) => {
  app.use('/api/search', require('./src/routes/searchRoutes'));
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
    environment: process.env.NODE_ENV || 'development',
    modules: ['salesMartins', 'productViewer'],
    status: 'API funcionando sem autenticação',
    publicAccess: true
  });
});

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend-react/build')));
}

// Handle API requests normally
app.get('/api/*', (req, res, next) => {
  next();
});

// Handle static assets normally
app.get('*.js', (req, res, next) => next());
app.get('*.css', (req, res, next) => next());
app.get('*.png', (req, res, next) => next());
app.get('*.jpg', (req, res, next) => next());
app.get('*.svg', (req, res, next) => next());
app.get('*.ico', (req, res, next) => next());

// Force redirect any root access to sales-martins
app.get('/', (req, res) => {
  res.redirect('/sales-martins');
});

// For most routes, redirect to sales-martins
app.get('*', (req, res, next) => {
  // Skip API routes, static assets, and sales-martins itself
  if (req.path.startsWith('/api/') ||
    req.path.includes('.') ||
    req.path === '/sales-martins' ||
    req.path.startsWith('/sales-martins/')) {
    return next();
  }

  // Redirect everything else to sales-martins
  res.redirect('/sales-martins');
});

// Special handling for sales-martins routes to work with React Router
app.get('/sales-martins/*', (req, res) => {
  // In production, serve the index.html for React Router to handle the route
  if (process.env.NODE_ENV === 'production') {
    res.sendFile(path.join(__dirname, '../frontend-react/build/index.html'));
  } else {
    // In development, redirect to the development server (usually port 3000)
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

// Start the server
app.listen(PORT, () => {
  console.log(`Servidor rodando em modo ${process.env.NODE_ENV || 'DESENVOLVIMENTO'} na porta ${PORT}`);
  console.log('Sales Martins - Exibidor de Produtos ativo (acesso direto sem autenticação)');
  console.log('Todas as requisições serão redirecionadas para /sales-martins');
});

module.exports = app;
