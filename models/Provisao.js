const db = require('../db');

module.exports = {
  upsert: async ({ empresa_id, funcionario_id, competencia, tipo, base, valor }) => {
    await db.query(`
      INSERT INTO provisoes_funcionais
        (empresa_id, funcionario_id, competencia, tipo, base, valor, status)
      VALUES (?, ?, ?, ?, ?, ?, 'previsto')
      ON DUPLICATE KEY UPDATE base = VALUES(base), valor = VALUES(valor)
    `, [empresa_id, funcionario_id, competencia, tipo, base, valor]);
  }
};
