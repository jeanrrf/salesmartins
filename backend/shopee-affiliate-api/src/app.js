const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

// Cria a aplicação Express
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, '../public')));

// Rotas da API
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', environment: process.env.NODE_ENV });
});

// Importar outras rotas se existirem
try {
    const productRoutes = require('./routes/products');
    app.use('/api/products', productRoutes);
} catch (error) {
    console.log('Products routes not available');
}

// Rota para redirecionar para sales-martins
app.get('/', (req, res) => {
    res.redirect('/sales-martins');
});

// Rota para sales-martins
app.get('/sales-martins', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Handler para erros 404
app.use((req, res) => {
    res.status(404).json({ error: 'Not Found' });
});

// Handler global de erros
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
});

module.exports = app;