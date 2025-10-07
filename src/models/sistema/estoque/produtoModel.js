const pool = require('../../../../db');

const normalize = (s) =>
  String(s)
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

module.exports = {
  async create({ nome, categoria, unidade_padrao, marca, ean }, usuarioId) {
    if (!usuarioId) throw new Error('usuarioId ausente em produtoModel.create');

    const nome_normalizado = normalize(nome);
    const sql = `
      INSERT INTO produtos
        (usuario_id, nome, nome_normalizado, categoria, unidade_padrao, marca, ean, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `;
    const params = [
      usuarioId,
      nome,
      nome_normalizado,
      categoria || null,
      unidade_padrao || null,
      marca || null,
      ean || null
    ];
    const [result] = await pool.execute(sql, params);
    return { id: result.insertId, nome, nome_normalizado };
  },

  async existsByNomeNormalizado(nome, usuarioId) {
    if (!usuarioId) throw new Error('usuarioId ausente em existsByNomeNormalizado');
    const nome_normalizado = normalize(nome);
    const [rows] = await pool.execute(
      `SELECT id FROM produtos WHERE usuario_id = ? AND nome_normalizado = ? LIMIT 1`,
      [usuarioId, nome_normalizado]
    );
    return rows.length > 0;
  },

  async listarTodos(usuarioId) {
    if (!usuarioId) throw new Error('usuarioId ausente em listarTodos');
    const [rows] = await pool.query(
      `SELECT id, nome, categoria, unidade_padrao, marca, ean
         FROM produtos
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
