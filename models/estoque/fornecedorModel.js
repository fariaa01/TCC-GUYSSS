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

  async findAll(usuarioId) {
    return this.listarTodos(usuarioId);
  }
};
