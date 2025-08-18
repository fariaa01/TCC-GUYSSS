const db = require('../db');

module.exports = {
  async calcularAlocacoes({ empresa, metodo, valorBase, rateioJson, competencia }) {
    if (metodo === 'igual') {
      const [ccs] = await db.query(`SELECT slug AS centro FROM centros_custo WHERE empresa_id = ? AND ativo = 1`, [empresa]);
      const n = ccs.length || 1;
      return (ccs.length ? ccs : [{ centro: null }]).map(c => ({ centro_custo: c.centro, valor: +(valorBase / n).toFixed(2) }));
    }

    if (metodo === 'percentual') {
      const entries = Object.entries(rateioJson || {});
      const aloc = entries.map(([cc, pct]) => ({ centro_custo: cc, valor: +(valorBase * (Number(pct) / 100)).toFixed(2) }));
      return aloc;
    }

    if (metodo === 'faturamento') {
      const [rows] = await db.query(`
        SELECT centro_custo, SUM(valor) AS receita
        FROM financeiro
        WHERE empresa_id = ? AND tipo = 'entrada' AND data >= DATE_SUB(?, INTERVAL 30 DAY)
        GROUP BY centro_custo
      `, [empresa, competencia]);
      const total = rows.reduce((s, r) => s + Number(r.receita || 0), 0) || 1;
      return rows.map(r => ({ centro_custo: r.centro_custo, valor: +((valorBase * (r.receita / total))).toFixed(2) }));
    }

    if (metodo === 'horas') {
      const [rows] = await db.query(`
        SELECT centro_custo, SUM(horas) AS horas
        FROM horas_operacao
        WHERE empresa_id = ? AND competencia = ?
        GROUP BY centro_custo
      `, [empresa, competencia]);
      const total = rows.reduce((s, r) => s + Number(r.horas || 0), 0) || 1;
      return rows.map(r => ({ centro_custo: r.centro_custo, valor: +((valorBase * (r.horas / total))).toFixed(2) }));
    }

    return [{ centro_custo: null, valor: valorBase }];
  }
};
