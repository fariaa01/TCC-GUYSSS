const pool = require('../db');
const bcrypt = require('bcryptjs');

module.exports = {
  async findByEmail(email) {
    const [rows] = await pool.query(
      'SELECT * FROM clientes WHERE email = ? LIMIT 1',
      [email]
    );
    return rows[0] || null;
  },

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM clientes WHERE id = ? LIMIT 1', [id]);
    return rows[0] || null;
  },

  async create({ nome, email, senha }) {
    const senha_hash = await bcrypt.hash(senha, 10);
    const [res] = await pool.query(
      `INSERT INTO clientes (nome, email, senha_hash)
       VALUES (?,?,?)`,
      [nome, email, senha_hash]
    );
    const [rows] = await pool.query('SELECT * FROM clientes WHERE id = ?', [res.insertId]);
    return rows[0];
  },

  async checkPassword(plain, hash) {
    return bcrypt.compare(plain, hash);
  }
};
