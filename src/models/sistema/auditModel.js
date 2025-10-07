const db = require('../../../db');

module.exports = {
  async log({ user_id, entity, entity_id, action, before_json, after_json }) {
    await db.query(
      `INSERT INTO logs_auditoria (usuario_id, entidade, entidade_id, acao, antes_json, depois_json) VALUES (?, ?, ?, ?, ?, ?)`,
      [user_id || null, entity, entity_id, action, JSON.stringify(before_json ?? null), JSON.stringify(after_json ?? null)]
    );
  }
};
