const FixedExpense = require('../models/FixedExpense');
const ContasPagar = require('../models/ContasPagar');
const Alerta = require('../models/Alerta');
const Provisao = require('../models/Provisao');
const rateio = require('./rateioService');
const { firstDayOfMonth, dueDateForMonth } = require('./dateUtils');
const db = require('../db');

async function gerarParcelasDoMes(empresaId, refDate = new Date()) {
  const competencia = firstDayOfMonth(refDate);
  const fixos = await FixedExpense.findActive(empresaId, competencia);

  for (const fx of fixos) {
    const vencimento = dueDateForMonth(competencia, fx.dia_vencimento);

    let valorBase = Number(fx.valor_base);
    if (fx.reajuste_mes && (fx.reajuste_mes === (competencia.getMonth() + 1))) {
      if (fx.reajuste_percentual) {
        valorBase = +(valorBase * (1 + Number(fx.reajuste_percentual))).toFixed(2);
      }
      await db.query('UPDATE gastos_fixos SET valor_base = ? WHERE id = ?', [valorBase, fx.id]);
    }

    let rateioJson = null;
    try { rateioJson = fx.rateio_json ? JSON.parse(fx.rateio_json) : null; } catch {}
    const alocacoes = await rateio.calcularAlocacoes({
      empresa: fx.empresa_id,
      metodo: fx.rateio_metodo,
      valorBase,
      rateioJson,
      competencia
    });

    for (const a of alocacoes) {
      await ContasPagar.upsertParcela({
        empresa_id: fx.empresa_id,
        gasto_fixo_id: fx.id,
        competencia,
        vencimento,
        valor: a.valor,
        categoria: fx.categoria,
        subcategoria: fx.subcategoria,
        centro_custo: a.centro_custo,
        forma_pagamento: fx.forma_pagamento
      });
    }
  }
}

async function criarAlertasVencimento5d(empresaId) {
  const contas = await ContasPagar.listarVencendoEmXDias(empresaId, 5);
  for (const c of contas) {
    await Alerta.criarSeNaoExiste({
      empresa_id: c.empresa_id,
      tipo: 'conta_vencimento_5d',
      referencia_id: c.id,
      mensagem: `Conta a pagar #${c.id} vence em 5 dias (R$ ${Number(c.valor).toFixed(2)})`,
      data_alerta: new Date()
    });
  }
}

async function gerarProvisoesPessoais(empresaId, refDate = new Date()) {
  const competencia = firstDayOfMonth(refDate);
  const [funcs] = await db.query(`
    SELECT id, salario_base
    FROM funcionarios
    WHERE empresa_id = ? AND status = 'ativo'
  `, [empresaId]);

  for (const f of funcs) {
    const salario = Number(f.salario_base || 0);

    const prov13 = +(salario / 12).toFixed(2);
    await Provisao.upsert({
      empresa_id: empresaId,
      funcionario_id: f.id,
      competencia,
      tipo: '13',
      base: salario,
      valor: prov13
    });

    const provFerias = +((salario / 12) * (1 + 1/3)).toFixed(2);
    await Provisao.upsert({
      empresa_id: empresaId,
      funcionario_id: f.id,
      competencia,
      tipo: 'ferias',
      base: salario,
      valor: provFerias
    });
  }
}

module.exports = { gerarParcelasDoMes, criarAlertasVencimento5d, gerarProvisoesPessoais };
