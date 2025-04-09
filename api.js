const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const fs = require('fs');

const app = express();
const SECRET_KEY = 'your_secret_key';

// Middleware para processar o corpo das requisições JSON
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Servir arquivos estáticos do diretório 'frontend'
app.use(express.static(path.join(__dirname, '../frontend')));

// Rota para a página principal - redirecionando para a vitrine
app.get('/', (req, res) => {
  res.redirect('/vitrine.html');
});

// Rota para a vitrine
app.get('/vitrine', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/vitrine.html'));
});

// Rota para a página de login
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

// Rota pública para listar categorias
app.get('/api/categories', (req, res) => {
  try {
    // Tentar carregar as categorias do arquivo JSON
    const categoriesPath = path.join(__dirname, 'CATEGORIA.json');
    if (fs.existsSync(categoriesPath)) {
      const categoriesData = fs.readFileSync(categoriesPath, 'utf8');
      const categories = JSON.parse(categoriesData);
      res.json(categories);
    } else {
      res.json({ message: 'Arquivo de categorias não encontrado', categories: [] });
    }
  } catch (error) {
    res.status(500).json({ error: 'Erro ao carregar categorias', message: error.message });
  }
});

// Rota pública para listar produtos
app.get('/api/products', (req, res) => {
  res.json({ message: 'Lista de produtos', products: [] });
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

// Middleware para autenticação
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).redirect('/login');
  }
  
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).redirect('/login');
  }
};

// Rotas administrativas protegidas
app.get('/admin', authenticate, (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Rota protegida para buscador de produtos
app.get('/api/search', authenticate, (req, res) => {
  res.json({ message: 'Buscador de produtos', results: [] });
});

// Rota protegida para arrumador de categorias
app.get('/api/category-repair', authenticate, (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/category-repair.html'));
});

// Inicia o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor Node.js rodando na porta ${PORT}`);
});