const db = require('../db');

function buildWhere({ start, end, tipo, categoria, subcategoria, centro_custo, busca }, empresaId, usuarioId) {
  const where = [];
  const params = [];

  if (empresaId) { where.push('empresa_id = ?'); params.push(empresaId); }
  if (!empresaId && usuarioId) { where.push('usuario_id = ?'); params.push(usuarioId); }

  if (start) { where.push('data >= ?'); params.push(start); }
  if (end)   { where.push('data <= ?'); params.push(end); }

  if (tipo)         { where.push('tipo = ?'); params.push(tipo); }
  if (categoria)    { where.push('categoria = ?'); params.push(categoria); }
  if (subcategoria) { where.push('subcategoria = ?'); params.push(subcategoria); }
  if (centro_custo) { where.push('centro_custo = ?'); params.push(centro_custo); }

  if (busca) {
    where.push('(descricao LIKE ? OR categoria LIKE ? OR subcategoria LIKE ?)');
    params.push(`%${busca}%`, `%${busca}%`, `%${busca}%`);
  }

  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  return { clause, params };
}

module.exports = {
  list: async (empresaId, filters = {}, usuarioId = null) => {
    const { page = 1, perPage = 100, order = 'data DESC, id DESC' } = filters;
    const offset = (page - 1) * perPage;

    const { clause, params } = buildWhere(filters, empresaId, usuarioId);

    const [rows] = await db.query(
      `SELECT id, empresa_id, usuario_id, tipo, categoria, subcategoria, valor, DATE(data) AS data,
              forma_pagamento, descricao, centro_custo, origem, origem_id
       FROM financeiro
       ${clause}
       ORDER BY ${order}
       LIMIT ? OFFSET ?`,
      [...params, Number(perPage), Number(offset)]
    );

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM financeiro ${clause}`, params
    );

    return { data: rows, total, page, perPage };
  },

  getResumo: async (empresaId, { start, end } = {}, usuarioId = null) => {
    const { clause, params } = buildWhere({ start, end }, empresaId, usuarioId);
    const [[res]] = await db.query(
      `SELECT
         SUM(CASE WHEN tipo='entrada' THEN valor ELSE 0 END) AS totalEntradas,
         SUM(CASE WHEN tipo='saida'   THEN valor ELSE 0 END) AS totalSaidas
       FROM financeiro
       ${clause}`,
      params
    );
    const entradas = Number(res.totalEntradas || 0);
    const saidas   = Number(res.totalSaidas || 0);
    return {
      totalEntradas: entradas,
      totalSaidas: saidas,
      saldo: +(entradas - saidas).toFixed(2)
    };
  },

  createManual: async (dados, empresaId, usuarioId = null) => {
    const {
      tipo, categoria, subcategoria = null, valor, data,
      forma_pagamento = null, descricao = null, centro_custo = null
    } = dados;

    await db.query(
      `INSERT INTO financeiro
         (empresa_id, usuario_id, tipo, categoria, subcategoria, valor, data, forma_pagamento, descricao, centro_custo, origem, origem_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL)`,
      [empresaId || null, usuarioId || null, tipo, categoria, subcategoria, valor, data, forma_pagamento, descricao, centro_custo]
    );
  },

  updateManual: async (id, dados, empresaId, usuarioId = null) => {
    const {
      tipo, categoria, subcategoria = null, valor, data,
      forma_pagamento = null, descricao = null, centro_custo = null
    } = dados;

    const where = [];
    const params = [];

    if (empresaId) { where.push('empresa_id = ?'); params.push(empresaId); }
    if (!empresaId && usuarioId) { where.push('usuario_id = ?'); params.push(usuarioId); }

    await db.query(
      `UPDATE financeiro
          SET tipo = ?, categoria = ?, subcategoria = ?, valor = ?, data = ?, forma_pagamento = ?, descricao = ?, centro_custo = ?
        WHERE id = ?
          ${where.length ? 'AND ' + where.join(' AND ') : ''}`,
      [tipo, categoria, subcategoria, valor, data, forma_pagamento, descricao, centro_custo, id, ...params]
    );
  },

  delete: async (id, empresaId = null, usuarioId = null) => {
    const where = [];
    const params = [];

    if (empresaId) { where.push('empresa_id = ?'); params.push(empresaId); }
    if (!empresaId && usuarioId) { where.push('usuario_id = ?'); params.push(usuarioId); }

    const [chk] = await db.query(
      `SELECT origem FROM financeiro WHERE id = ? ${where.length ? 'AND ' + where.join(' AND ') : ''} LIMIT 1`,
      [id, ...params]
    );
    const row = chk[0];
    if (!row) throw new Error('Lançamento não encontrado');
    if (row.origem) throw new Error('Não é possível excluir: lançamento conciliado (origem).');

    await db.query(
      `DELETE FROM financeiro WHERE id = ? ${where.length ? 'AND ' + where.join(' AND ') : ''}`,
      [id, ...params]
    );
  },

  lancarSaidaDeContaPagar: async (empresa_id, conta) => {
    await db.query(
      `INSERT INTO financeiro
         (empresa_id, tipo, categoria, subcategoria, valor, data, forma_pagamento, descricao, centro_custo, origem, origem_id)
       VALUES (?, 'saida', ?, ?, ?, DATE(?), ?, ?, ?, 'conta_pagar', ?)`,
      [
        empresa_id,
        conta.categoria,
        conta.subcategoria || null,
        conta.valor,
        conta.pago_em || new Date(),
        conta.forma_pagamento || null,
        `Conta a pagar #${conta.id}`,
        conta.centro_custo || null,
        conta.id
      ]
    );
  },

  lancarEntradaDeReceber: async (empresa_id, recebivel) => {
    await db.query(
      `INSERT INTO financeiro
         (empresa_id, tipo, categoria, subcategoria, valor, data, forma_pagamento, descricao, centro_custo, origem, origem_id)
       VALUES (?, 'entrada', ?, ?, ?, DATE(?), ?, ?, ?, 'conta_receber', ?)`,
      [
        empresa_id,
        recebivel.categoria,
        recebivel.subcategoria || null,
        recebivel.valor,
        recebivel.recebido_em || new Date(),
        recebivel.forma_pagamento || null,
        `Conta a receber #${recebivel.id}`,
        recebivel.centro_custo || null,
        recebivel.id
      ]
    );
  },

  getById: async (id, empresaId = null, usuarioId = null) => {
    const where = [];
    const params = [];

    if (empresaId) { where.push('empresa_id = ?'); params.push(empresaId); }
    if (!empresaId && usuarioId) { where.push('usuario_id = ?'); params.push(usuarioId); }

    const [rows] = await db.query(
      `SELECT id, empresa_id, usuario_id, tipo, categoria, subcategoria, valor, DATE(data) AS data,
              forma_pagamento, descricao, centro_custo, origem, origem_id
       FROM financeiro
       WHERE id = ?
         ${where.length ? 'AND ' + where.join(' AND ') : ''} LIMIT 1`,
      [id, ...params]
    );
    return rows[0] || null;
  }
};
