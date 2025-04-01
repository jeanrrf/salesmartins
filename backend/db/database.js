const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Caminho para o banco de dados SQLite
const dbPath = path.join(__dirname, '../../shopee-analytics.db');

// Criar conexão com o banco de dados
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err.message);
  } else {
    console.log('Conectado ao banco de dados SQLite:', dbPath);
  }
});

// Função para executar consultas com promisses
const runQuery = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) {
        console.error('Erro na consulta:', err.message);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

module.exports = { db, runQuery };