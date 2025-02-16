const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const path = require('path');

// Configurações
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Banco de Dados
const db = new sqlite3.Database('./database.db');

// Criação das Tabelas
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tipo TEXT,
      conteudo TEXT,
      data TEXT
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS audios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      codigo TEXT,
      caminho TEXT
    )
  `);
});

// Rotas para Posts
app.get('/api/posts', (req, res) => {
  db.all('SELECT * FROM posts', (err, rows) => {
    if (err) res.status(500).send(err);
    else res.json(rows);
  });
});

app.post('/api/posts', (req, res) => {
  const { tipo, conteudo } = req.body;
  db.run(
    'INSERT INTO posts (tipo, conteudo, data) VALUES (?, ?, ?)',
    [tipo, conteudo, new Date().toISOString()],
    (err) => {
      if (err) res.status(500).send(err);
      else res.send('Post adicionado!');
    }
  );
});

// Rotas para Áudios
app.get('/api/audios', (req, res) => {
  const codigo = req.query.codigo;
  db.get('SELECT * FROM audios WHERE codigo = ?', [codigo], (err, row) => {
    if (err) res.status(500).send(err);
    else res.json(row || null);
  });
});

app.post('/api/audios', (req, res) => {
  const { codigo, caminho } = req.body;
  db.run(
    'INSERT INTO audios (codigo, caminho) VALUES (?, ?)',
    [codigo, caminho],
    (err) => {
      if (err) res.status(500).send(err);
      else res.send('Áudio adicionado!');
    }
  );
});

// Iniciar Servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});