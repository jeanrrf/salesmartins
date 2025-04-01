const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');

const app = express();
const SECRET_KEY = 'your_secret_key';

app.use(bodyParser.json());

// Middleware para autenticação
const adminAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).send('Token não fornecido');
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    if (decoded.email === 'salesmartins.siaw@gmail.com') {
      return next();
    }
    return res.status(403).send('Acesso negado');
  } catch (err) {
    return res.status(403).send('Token inválido');
  }
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
    const token = jwt.sign({ email }, SECRET_KEY, { expiresIn: '1h' });
    return res.status(200).json({ token });
  }

  return res.status(401).send('Credenciais inválidas');
});

// Inicia o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});