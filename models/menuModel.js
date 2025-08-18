const db = require('../db');

const ALLOWED_COLUMNS = new Set([
  'nome_prato','preco','descricao','imagem','ingredientes','categoria','tamanho','porcao',
  'destaque','is_disponivel','arquivado','atualizado_por'
]);

function buildUpdateSet(data) {
  const keys = Object.keys(data).filter(k => ALLOWED_COLUMNS.has(k) && data[k] !== undefined);
  if (!keys.length) return { setSql: '', vals: [] };
  const setSql = keys.map(k => `${k} = ?`).join(', ');
  const vals = keys.map(k => data[k]);
  return { setSql, vals };
}

module.exports = {
  getAllByUsuario: async (usuarioId, { incluirArquivados = true } = {}) => {
    let sql = 'SELECT * FROM menu WHERE usuario_id = ?';
    const params = [usuarioId];
    if (!incluirArquivados) {
      sql += ' AND (arquivado IS NULL OR arquivado = 0)';
    }
    sql += ' ORDER BY COALESCE(arquivado,0) ASC, id DESC';
    const [rows] = await db.query(sql, params);
    return rows;
  },

  getById: async (id, usuarioId) => {
    const [rows] = await db.query(
      'SELECT * FROM menu WHERE id = ? AND usuario_id = ? LIMIT 1',
      [id, usuarioId]
    );
    return rows[0] || null;
  },

  create: async (dados) => {
    const {
      nome_prato, preco, descricao = null, imagem = null, usuario_id,
      destaque = 0, ingredientes = null, categoria = null, tamanho = null, porcao = null,
      is_disponivel = 1, arquivado = 0, atualizado_por = null
    } = dados;

    const sql = `
      INSERT INTO menu
        (nome_prato, preco, descricao, imagem, usuario_id, destaque, ingredientes, categoria, tamanho, porcao, is_disponivel, arquivado, atualizado_por)
      VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await db.query(sql, [
      nome_prato, preco, descricao, imagem, usuario_id,
      destaque ? 1 : 0, ingredientes, categoria, tamanho, porcao,
      is_disponivel ? 1 : 0, arquivado ? 1 : 0, atualizado_por
    ]);
  },

  update: async (id, dados) => {
    if (dados.imagem === undefined) {
      delete dados.imagem;
    }
    const { setSql, vals } = buildUpdateSet(dados);
    if (!setSql) return;
    const sql = `UPDATE menu SET ${setSql} WHERE id = ?`;
    vals.push(id);
    await db.query(sql, vals);
  },

  updatePartial: async (id, usuarioId, data) => {
    const { setSql, vals } = buildUpdateSet(data);
    if (!setSql) return;
    const sql = `UPDATE menu SET ${setSql} WHERE id = ? AND usuario_id = ?`;
    vals.push(id, usuarioId);
    await db.query(sql, vals);
  },

  delete: async (id) => {
    await db.query('DELETE FROM menu WHERE id = ?', [id]);
  },

  getPublicByUsuario: async (usuarioId) => {
    const [rows] = await db.query(
      `SELECT id, nome_prato, preco, descricao, imagem, destaque
         FROM menu
        WHERE usuario_id = ?
          AND COALESCE(arquivado, 0) = 0
          AND COALESCE(is_disponivel, 1) = 1
        ORDER BY destaque DESC, nome_prato ASC`,
      [usuarioId]
    );
    return rows;
  },
};
