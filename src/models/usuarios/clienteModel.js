const pool = require('../../../db');

module.exports = {
  async buscarPorEmail(email) {
    const emailNorm = String(email).trim().toLowerCase();
    const [rows] = await pool.query(
      'SELECT id, nome, email, senha_hash FROM clientes WHERE email = ? LIMIT 1',
      [emailNorm]
    );
    return rows[0] || null;
  },

  async emailExiste(email) {
    const emailNorm = String(email).trim().toLowerCase();
    const [rows] = await pool.query(
      'SELECT id FROM clientes WHERE email = ? LIMIT 1',
      [emailNorm]
    );
    return !!rows[0];
  },

  async criar({ nome, email, senha_hash }) {
    const nomeNorm = String(nome).trim();
    const emailNorm = String(email).trim().toLowerCase();
    const [ins] = await pool.query(
      'INSERT INTO clientes (nome, email, senha_hash, criado_em) VALUES (?, ?, ?, NOW())',
      [nomeNorm, emailNorm, senha_hash]
    );
    return ins.insertId;
  },
};
