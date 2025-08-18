const db = require('../db');

module.exports = {
  upsertParcela: async (dados) => {
    const {
      empresa_id, gasto_fixo_id, competencia, vencimento,
      valor, categoria, subcategoria, centro_custo, forma_pagamento
    } = dados;

    await db.query(`
      INSERT INTO contas_pagar
        (empresa_id, gasto_fixo_id, competencia, vencimento, valor, categoria, subcategoria, centro_custo, forma_pagamento, status, origem)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'previsto', 'gasto_fixo')
      ON DUPLICATE KEY UPDATE
        vencimento = VALUES(vencimento),
        valor = VALUES(valor),
        categoria = VALUES(categoria),
        subcategoria = VALUES(subcategoria),
        centro_custo = VALUES(centro_custo),
        forma_pagamento = VALUES(forma_pagamento)
    `, [empresa_id, gasto_fixo_id, competencia, vencimento, valor, categoria, subcategoria, centro_custo, forma_pagamento]);
  },

  listarVencendoEmXDias: async (empresaId, dias) => {
    const [rows] = await db.query(`
      SELECT * FROM contas_pagar
      WHERE empresa_id = ?
        AND status = 'previsto'
        AND DATEDIFF(vencimento, CURDATE()) = ?
    `, [empresaId, dias]);
    return rows;
  },

  marcarPago: async (id, { forma_pagamento, dataPagamento }) => {
    await db.query(`
      UPDATE contas_pagar
      SET status = 'pago',
          pago_em = ?,
          forma_pagamento = IFNULL(?, forma_pagamento)
      WHERE id = ?
    `, [dataPagamento, forma_pagamento || null, id]);

    const [rows] = await db.query('SELECT * FROM contas_pagar WHERE id = ?', [id]);
    return rows[0];
  },

  conciliar: async (id) => {
    await db.query('UPDATE contas_pagar SET conciliado = 1 WHERE id = ?', [id]);
  },

  atualizarVencidos: async (empresaId) => {
    await db.query(
      `UPDATE contas_pagar
       SET status = 'vencido'
       WHERE empresa_id = ? AND status = 'previsto' AND vencimento < CURDATE()`,
      [empresaId]
    );
  },

  list: async (empresaId, { start = null, end = null, status = null } = {}) => {
    const where = ['empresa_id = ?'];
    const params = [empresaId];
    if (start) { where.push('vencimento >= ?'); params.push(start); }
    if (end)   { where.push('vencimento <= ?'); params.push(end); }
    if (status){ where.push('status = ?'); params.push(status); }

    const [rows] = await db.query(
      `SELECT * FROM contas_pagar
       WHERE ${where.join(' AND ')}
       ORDER BY vencimento ASC, id ASC`,
      params
    );
    return rows;
  },

  totaisPorStatus: async (empresaId, { start = null, end = null } = {}) => {
    const where = ['empresa_id = ?'];
    const params = [empresaId];
    if (start) { where.push('vencimento >= ?'); params.push(start); }
    if (end)   { where.push('vencimento <= ?'); params.push(end); }

    const [rows] = await db.query(
      `SELECT status, COUNT(*) qtd
       FROM contas_pagar
       WHERE ${where.join(' AND ')}
       GROUP BY status`,
      params
    );

    const out = { previsto: 0, vencido: 0, pago: 0, cancelado: 0 };
    rows.forEach(r => { out[r.status] = Number(r.qtd || 0); });
    return out;
  }
};
