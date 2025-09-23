const pool = require('../../db');

function buildFilters({ categoria, fornecedor, validade, usuarioId }) {
  let sql = `SELECT 
      id, produto, categoria, quantidade, quantidade_minima,
      unidade_medida, valor, validade, fornecedor, usuario_id
    FROM estoque
    WHERE usuario_id = ?`;
  const params = [usuarioId];

  if (categoria) { sql += ` AND categoria = ?`; params.push(categoria); }
  if (fornecedor) { sql += ` AND fornecedor = ?`; params.push(fornecedor); }
  if (validade === 'vencido') {
    sql += ` AND validade IS NOT NULL AND validade < CURRENT_DATE()`;
  } else if (validade === 'proximo') {
    sql += ` AND validade IS NOT NULL 
             AND validade BETWEEN CURRENT_DATE() AND DATE_ADD(CURRENT_DATE(), INTERVAL 7 DAY)`;
  }

  sql += ` ORDER BY produto ASC`;
  return { sql, params };
}

function normStr(v) {
  if (v === undefined) return undefined;
  if (v === null) return null;
  const s = String(v).trim();
  return s === '' ? null : s;
}
function parseNum(v, fallback = 0) {
  if (v === undefined) return undefined;
  if (v === null || v === '') return null;
  const n = Number(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : fallback;
}
function parseMoney(v, fallback = 0) {
  return parseNum(v, fallback);
}
function parseDateOrNull(v) {
  if (v === undefined) return undefined;
  if (v === null || v === '') return null;
  return v; // assume YYYY-MM-DD já válido
}

module.exports = {
  async getFiltrado({ categoria, fornecedor, validade, usuarioId }) {
    const { sql, params } = buildFilters({ categoria, fornecedor, validade, usuarioId });
    const [rows] = await pool.query(sql, params);
    return rows;
  },

  async create(body, usuarioId) {
    const sql = `
      INSERT INTO estoque
        (produto, categoria, quantidade, quantidade_minima, unidade_medida, valor, validade, fornecedor, usuario_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      normStr(body.produto),
      normStr(body.categoria),
      parseNum(body.quantidade, 0),
      parseNum(body.quantidade_minima, 0),
      normStr(body.unidade_medida),
      parseMoney(body.valor, 0),
      parseDateOrNull(body.validade),
      normStr(body.fornecedor),
      usuarioId
    ];

    const [result] = await pool.query(sql, params);
    return result.insertId;
  },

  async update(id, body, usuarioId) {
    const whitelist = {
      produto:              normStr(body.produto),
      categoria:            normStr(body.categoria),
      quantidade:           parseNum(body.quantidade),
      quantidade_minima:    parseNum(body.quantidade_minima),
      unidade_medida:       normStr(body.unidade_medida),
      valor:                parseMoney(body.valor),
      validade:             parseDateOrNull(body.validade),
      fornecedor:           normStr(body.fornecedor)
    };

    const sets = [];
    const values = [];

    for (const [col, val] of Object.entries(whitelist)) {
      if (val !== undefined) {
        sets.push(`${col} = ?`);
        values.push(val);
      }
    }

    if (sets.length === 0) {
      return { affectedRows: 0, warning: 'no_fields' };
    }

    values.push(Number(id), usuarioId);

    const sql = `
      UPDATE estoque
         SET ${sets.join(', ')}
       WHERE id = ? AND usuario_id = ?
    `;

    const [result] = await pool.query(sql, values);
    return result;
  },

  async delete(id, usuarioId) {
    const sql = `DELETE FROM estoque WHERE id = ? AND usuario_id = ?`;
    const [result] = await pool.query(sql, [Number(id), usuarioId]);
    return result.affectedRows > 0;
  }
};
