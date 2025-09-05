const pool = require('../../db');

function onlyDigits(str = '') {
  return String(str).replace(/\D+/g, '');
}

module.exports = {
  async create({ nome, email, cnpj, telefone }, usuarioId) {
    if (!usuarioId) throw new Error('usuarioId ausente em fornecedorModel.create');

    const cnpjDigits = cnpj ? onlyDigits(cnpj) : null;
    const sql = `
      INSERT INTO fornecedores
        (usuario_id, nome, email, cnpj, telefone, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, NOW(), NOW())
    `;
    const params = [usuarioId, nome, email || null, cnpjDigits || null, telefone || null];
    const [result] = await pool.execute(sql, params);
    return { id: result.insertId };
  },

  async listarTodos(usuarioId) {
    if (!usuarioId) throw new Error('usuarioId ausente em listarTodos');
    const [rows] = await pool.query(
      `SELECT id, nome, email, cnpj, telefone
         FROM fornecedores
        WHERE usuario_id = ?
        ORDER BY nome ASC`,
      [usuarioId]
    );
    return rows;
  },

  async findAll(usuarioId) { return this.listarTodos(usuarioId); },
  async getAll(usuarioId)  { return this.listarTodos(usuarioId); },

  async getById(id, usuarioId) {
    if (!usuarioId) throw new Error('usuarioId ausente em getById');
    const [rows] = await pool.query(
      `SELECT id, nome, email, cnpj, telefone
         FROM fornecedores
        WHERE id = ? AND usuario_id = ?
        LIMIT 1`,
      [id, usuarioId]
    );
    return rows[0] || null;
  },

  async updateById(id, usuarioId, { nome, email, cnpj, telefone }) {
    if (!usuarioId) throw new Error('usuarioId ausente em updateById');

    const cnpjDigits = cnpj ? onlyDigits(cnpj) : null;

    const sql = `
      UPDATE fornecedores
         SET nome = ?, email = ?, cnpj = ?, telefone = ?, updated_at = NOW()
       WHERE id = ? AND usuario_id = ?
    `;
    const params = [nome, email || null, cnpjDigits || null, telefone || null, id, usuarioId];
    const [result] = await pool.execute(sql, params);

    return { affectedRows: result.affectedRows };
  },

  async deleteById(id, usuarioId) {
    if (!usuarioId) throw new Error('usuarioId ausente em deleteById');

    const [result] = await pool.execute(
      `DELETE FROM fornecedores WHERE id = ? AND usuario_id = ?`,
      [id, usuarioId]
    );
    return { affectedRows: result.affectedRows };
  },
};
