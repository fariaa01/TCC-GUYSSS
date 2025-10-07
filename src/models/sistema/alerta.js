const db = require('../../../db');
module.exports = {
  criarSeNaoExiste: async ({ empresa_id, tipo, referencia_id, mensagem, data_alerta }) => {
    await db.query(`
      INSERT IGNORE INTO alertas
        (empresa_id, tipo, referencia_id, mensagem, data_alerta)
      VALUES (?, ?, ?, ?, ?)
    `, [empresa_id, tipo, referencia_id, mensagem, data_alerta]);
  }
};
