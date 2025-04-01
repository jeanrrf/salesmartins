const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();

app.use(bodyParser.json());

// Middleware para autenticação
const adminAuth = (req, res, next) => {
  const adminEmail = 'salesmartins.siaw@gmail.com';

  // Permitir acesso automático para o e-mail do administrador
  if (req.headers['x-admin-email'] === adminEmail) {
    return next();
  }

  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).send('Autenticação necessária');
  }

  const credentials = Buffer.from(authHeader.split(' ')[1], 'base64').toString('utf-8');
  const [email, password] = credentials.split(':');

  if (email === adminEmail && password === 'vvh31676685') {
    return next();
  }

  return res.status(403).send('Acesso negado');
};

// Rota pública para vitrine.html
app.get('/vitrine', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/vitrine.html'));
});

// Rota pública para listar categorias
app.get('/api/categories', (req, res) => {
  res.send('Lista de categorias');
});

// Rota pública para listar produtos
app.get('/api/products', (req, res) => {
  res.send('Lista de produtos');
});

// Rota pública para o favicon
app.get('/favicon.ico', (req, res) => {
  res.status(204).send(); // Retorna um status 204 (sem conteúdo) para o favicon
});

// Middleware para proteger todas as outras rotas
app.use(adminAuth);

// Exemplo de rota administrativa
app.get('/admin', (req, res) => {
  res.send('Bem-vindo à área administrativa!');
});

// Rota protegida para buscador de produtos
app.get('/api/search', adminAuth, (req, res) => {
  res.send('Buscador de produtos');
});

// Rota protegida para arrumador de categorias
app.get('/api/category-repair', adminAuth, (req, res) => {
  res.send('Arrumador de categorias');
});

// Rota para autenticação de login
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const adminEmail = 'salesmartins.siaw@gmail.com';
  const adminPassword = 'vvh31676685';

  if (email === adminEmail && password === adminPassword) {
    return res.status(200).send('Autenticado com sucesso');
  }

  return res.status(401).send('Credenciais inválidas');
});

// Inicia o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});