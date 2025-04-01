const express = require('express');
const path = require('path');

const app = express();

// Middleware para autenticação
const adminAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send('Autenticação necessária');
  }

  const credentials = Buffer.from(authHeader.split(' ')[1], 'base64').toString('utf-8');
  const [email, password] = credentials.split(':');

  if (email === 'salesmartins.siaw@gmail.com' && password === 'vvh31676685') {
    return next();
  }

  return res.status(403).send('Acesso negado');
};

// Rota pública para vitrine.html
app.get('/vitrine', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/vitrine.html'));
});

// Middleware para proteger todas as outras rotas
app.use(adminAuth);

// Exemplo de rota administrativa
app.get('/admin', (req, res) => {
  res.send('Bem-vindo à área administrativa!');
});

// Inicia o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});