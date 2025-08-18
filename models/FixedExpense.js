const db = require('../db');

module.exports = {
  findActive: async (empresaId, refDate) => {
    const [rows] = await db.query(`
      SELECT * FROM gastos_fixos
      WHERE empresa_id = ? 
        AND status = 'ativo'
        AND inicio <= ?
        AND (fim IS NULL OR fim >= ?)
    `, [empresaId, refDate, refDate]);
    return rows;
  },
  findById: async (id) => {
    const [rows] = await db.query('SELECT * FROM gastos_fixos WHERE id = ?', [id]);
    return rows[0] || null;
  }
};
