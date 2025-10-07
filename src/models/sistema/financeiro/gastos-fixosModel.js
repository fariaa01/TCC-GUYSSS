const db = require('../../../../db');

module.exports = {
  getAll: async (userId) => {
    const [rows] = await db.query(
      `SELECT id, nome, valor, data_inicio, data_fim, recorrencia, observacao, criado_em
       FROM gastos_fixos
       WHERE usuario_id = ?
       ORDER BY nome ASC, id DESC`,
      [userId]
    );
    return rows;
  },

  getById: async (id, userId) => {
    const [rows] = await db.query(
      `SELECT id, nome, valor, data_inicio, data_fim, recorrencia, observacao, criado_em
       FROM gastos_fixos
       WHERE id = ? AND usuario_id = ?`,
      [id, userId]
    );
    return rows[0] || null;
  },

  getAtivosNoPeriodo: async (inicio, fim, userId) => {
    const [rows] = await db.query(
      `SELECT id, nome, valor, data_inicio, data_fim, recorrencia, observacao, criado_em
       FROM gastos_fixos
       WHERE usuario_id = ?
         AND data_inicio <= ?
         AND (data_fim IS NULL OR data_fim >= ?)
       ORDER BY nome ASC, id DESC`,
      [userId, fim, inicio]
    );
    return rows;
  },

  create: async ({ nome, valor, data_inicio, data_fim = null, recorrencia = 'mensal', observacao = null }, userId) => {
    await db.query(
      `INSERT INTO gastos_fixos (usuario_id, nome, valor, data_inicio, data_fim, recorrencia, observacao)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, nome, valor, data_inicio, data_fim, recorrencia, observacao]
    );
  },

  update: async (id, body, userId) => {
    const { nome, valor, data_inicio, data_fim, recorrencia, observacao } = body;
    await db.query(
      `UPDATE gastos_fixos
         SET nome = COALESCE(?, nome),
             valor = COALESCE(?, valor),
             data_inicio = COALESCE(?, data_inicio),
             data_fim = COALESCE(?, data_fim),
             recorrencia = COALESCE(?, recorrencia),
             observacao = COALESCE(?, observacao)
       WHERE id = ? AND usuario_id = ?`,
      [nome, valor, data_inicio, data_fim, recorrencia, observacao, id, userId]
    );
  },

  delete: async (id, userId) => {
    await db.query(
      `DELETE FROM gastos_fixos WHERE id = ? AND usuario_id = ?`,
      [id, userId]
    );
  }
};
