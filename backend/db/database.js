const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Caminho para o banco de dados SQLite
const dbPath = path.join(__dirname, '../../shopee-analytics.db');

// Verificar se o arquivo do banco de dados existe
const dbExists = fs.existsSync(dbPath);

// Criar conexão com o banco de dados
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err.message);
  } else {
    console.log('Conectado ao banco de dados SQLite em', dbPath);
  }
});

// Funções de utilidade para promisificar as operações do SQLite
const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        console.error('Erro na execução da query:', sql);
        reject(err);
      } else {
        resolve({ id: this.lastID, changes: this.changes });
      }
    });
  });
};

const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        console.error('Erro na execução da query:', sql);
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

const dbAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        console.error('Erro na execução da query:', sql);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

// Exportar a conexão e as funções de utilidade
module.exports = {
  db,
  dbRun,
  dbGet,
  dbAll
};