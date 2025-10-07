const db = require('../../../../db');

module.exports = {  
  getAll: async (userId) => {
    const [rows] = await db.query(
      `SELECT id, tipo, categoria, valor, data, created_at
       FROM financeiro
       WHERE usuario_id = ?
       ORDER BY data DESC, id DESC`,
      [userId]
    );
    return rows;
  },

  create: async ({ tipo, categoria, valor, data }, userId) => {
    await db.query(
      `INSERT INTO financeiro (usuario_id, tipo, categoria, valor, data)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, tipo, categoria, valor, data]
    );
  },

  update: async (id, body, userId) => {
    const { tipo, categoria, valor, data } = body;
    await db.query(
      `UPDATE financeiro
       SET tipo = ?, categoria = ?, valor = ?, data = ?
       WHERE id = ? AND usuario_id = ?`,
      [tipo, categoria, valor, data, id, userId]
    );
  },

  delete: async (id, userId) => {
    await db.query(
      `DELETE FROM financeiro WHERE id = ? AND usuario_id = ?`,
      [id, userId]
    );
  }
};
