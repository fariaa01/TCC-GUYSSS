const db = require('../../../db');
const bcrypt = require('bcrypt');

async function createUser(nome, email, senha) {
  const hash = await bcrypt.hash(senha, 10);
  await db.query('INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)', [nome, email, hash]);
}

async function findByEmail(email) {
  const [rows] = await db.query('SELECT * FROM usuarios WHERE email = ?', [email]);
  return rows[0];
}

async function findById(id) {
  const [rows] = await db.query('SELECT id, nome, email, nome_empresa FROM usuarios WHERE id = ?', [id]);
  return rows[0] || null;
}

async function searchByEmpresaNome(q, limit = 20) {
  const term = `%${q || ''}%`;
  const [rows] = await db.query(
    `SELECT id, nome_empresa
       FROM usuarios
      WHERE nome_empresa IS NOT NULL
        AND nome_empresa <> ''
        AND nome_empresa LIKE ?
      ORDER BY nome_empresa ASC
      LIMIT ?`,
    [term, Number(limit)]
  );
  return rows;
}

module.exports = { createUser, findByEmail, findById, searchByEmpresaNome };
