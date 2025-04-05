const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Carregar variáveis de ambiente
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Importar rotas
const affiliateRoutes = require('./src/routes/affiliateRoutes');
// Outras importações de rotas...

// Registrar rotas
app.use('/api/affiliate', affiliateRoutes);
// Outras rotas...

// Rota padrão para testar se a API está funcionando
app.get('/', (req, res) => {
  res.json({
    message: "Shopee Affiliate API está funcionando!",
    version: "1.0.0"
  });
});

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor iniciado na porta ${PORT}`);
});

module.exports = app;
