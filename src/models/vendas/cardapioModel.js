const db = require('../../../db');

module.exports = {
  listarPorUsuario: async (usuarioId) => {
    try {
      const [rows] = await db.pool.query(
        'SELECT * FROM pratos WHERE usuario_id = ? ORDER BY criado_em DESC',
        [usuarioId]
      );
      return rows;
    } catch (err) {
      throw err;
    }
  }
};
