const db = require('../../db');

const toNull = (v) => (v === '' || v === undefined ? null : v);
const toNumberOrNull = (v) => (v === '' || v === undefined || v === null ? null : Number(v));

module.exports = {
  getAll: async (usuarioId) => {
    const [rows] = await db.query(
      'SELECT * FROM estoque WHERE usuario_id = ? ORDER BY produto ASC',
      [usuarioId]
    );
    return rows;
  },

  getFiltrado: async ({ categoria, fornecedor, validade, usuarioId }) => {
    let query = 'SELECT * FROM estoque WHERE usuario_id = ?';
    const params = [usuarioId];

    if (categoria && categoria !== '') {
      query += ' AND categoria = ?';
      params.push(categoria);
    }

    if (fornecedor && fornecedor !== '') {
      query += ' AND fornecedor = ?';
      params.push(fornecedor);
    }

    if (validade === 'vencido') {
      query += ' AND validade IS NOT NULL AND validade < CURDATE()';
    } else if (validade === 'proximo') {
      query += ' AND validade IS NOT NULL AND validade BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)';
    }

    query += ' ORDER BY produto ASC';

    const [rows] = await db.query(query, params);
    return rows;
  },

  listarCategoriasUnicas: async (usuarioId) => {
    const [rows] = await db.query(
      `SELECT DISTINCT categoria 
         FROM estoque 
        WHERE usuario_id = ? 
          AND categoria IS NOT NULL 
          AND categoria <> ''
        ORDER BY categoria ASC`,
      [usuarioId]
    );
    return rows.map(r => r.categoria);
  },

  listarFornecedoresUnicos: async (usuarioId) => {
    const [rows] = await db.query(
      `SELECT DISTINCT fornecedor 
         FROM estoque 
        WHERE usuario_id = ? 
          AND fornecedor IS NOT NULL 
          AND fornecedor <> ''
        ORDER BY fornecedor ASC`,
      [usuarioId]
    );
    return rows.map(r => r.fornecedor);
  },

  // Criação com normalizações
  create: async (dados, usuarioId) => {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const {
        produto,
        categoria,
        quantidade,
        quantidade_minima,
        valor,
        unidade_medida,
        validade,
        fornecedor
      } = dados;

      const qte = toNumberOrNull(quantidade) ?? 0;
      const qteMin = toNumberOrNull(quantidade_minima) ?? 0;
      const vlr = toNumberOrNull(valor) ?? 0;
      const val = toNull(validade); // se vier '' vira NULL

      await conn.query(
        `INSERT INTO estoque 
          (produto, categoria, quantidade, quantidade_minima, valor, unidade_medida, validade, fornecedor, usuario_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          produto,
          toNull(categoria),
          qte,
          qteMin,
          vlr,
          toNull(unidade_medida),
          val,
          toNull(fornecedor),
          usuarioId
        ]
      );

      await conn.commit();
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  },

  update: async (id, dados, usuarioId) => {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const {
        produto,
        categoria,
        quantidade,
        quantidade_minima,
        valor,
        unidade_medida,
        validade,
        fornecedor
      } = dados;

      const qte = toNumberOrNull(quantidade);
      const qteMin = toNumberOrNull(quantidade_minima);
      const vlr = toNumberOrNull(valor);
      const val = toNull(validade);

      await conn.query(
        `UPDATE estoque 
            SET produto = ?,
                categoria = ?,
                quantidade = ?,
                quantidade_minima = ?,
                valor = ?,
                unidade_medida = ?,
                validade = ?,
                fornecedor = ?
          WHERE id = ? AND usuario_id = ?`,
        [
          produto,
          toNull(categoria),
          qte,
          qteMin,
          vlr,
          toNull(unidade_medida),
          val,
          toNull(fornecedor),
          id,
          usuarioId
        ]
      );

      await conn.commit();
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  },

  delete: async (id, usuarioId) => {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      await conn.query(
        'DELETE FROM estoque WHERE id = ? AND usuario_id = ?',
        [id, usuarioId]
      );

      await conn.commit();
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }
};
