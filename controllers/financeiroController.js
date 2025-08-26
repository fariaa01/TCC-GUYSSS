const Financeiro = require('../models/financeiro/financeiroModel');
const GastosFixos = require('../models/financeiro/gastos-fixosModel');

function getPeriodoMes(req) {
  const agora = new Date();
  const ano = parseInt(req.query.ano || agora.getFullYear(), 10);
  const mes = parseInt(req.query.mes || (agora.getMonth() + 1), 10);
  const inicio = new Date(ano, mes - 1, 1);
  const fim = new Date(ano, mes, 0);
  const toISO = (d) => d.toISOString().slice(0, 10);
  return { ano, mes, inicio, fim, inicioStr: toISO(inicio), fimStr: toISO(fim) };
}

function weeksInMonth(ano, mes) {
  const start = new Date(ano, mes - 1, 1);
  const end = new Date(ano, mes, 0);
  const days = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
  return Math.round(days / 7) || 4;
}

module.exports = {
  listar: async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) return res.redirect('/login');

      const { ano, mes, inicio, fim } = getPeriodoMes(req);
      const dados = await Financeiro.getAll(userId);

      const dadosMes = (dados || []).filter((d) => {
        const dd = new Date(d.data);
        if (Number.isNaN(dd.getTime())) {
          const s = String(d.data).slice(0, 10);
          return s >= `${ano}-${String(mes).padStart(2, '0')}-01` && s <= `${ano}-${String(mes).padStart(2, '0')}-${String(fim.getDate()).padStart(2, '0')}`;
        }
        return dd >= inicio && dd <= fim;
      });

      const totalEntradasMes = dadosMes
        .filter(d => d.tipo === 'entrada')
        .reduce((acc, cur) => acc + Number(cur.valor || 0), 0);

      const totalSaidasMes = dadosMes
        .filter(d => d.tipo === 'saida')
        .reduce((acc, cur) => acc + Number(cur.valor || 0), 0);

      const saldoFinalMes = totalEntradasMes - totalSaidasMes;

      const gastosFixos = await GastosFixos.getAll(userId);
      const semanas = weeksInMonth(ano, mes);

      const totalFixosMes = (gastosFixos || []).reduce((acc, g) => {
        const ini = new Date(g.data_inicio);
        const fimG = g.data_fim ? new Date(g.data_fim) : null;
        const ativo =
          (Number.isNaN(ini.getTime()) ? true : ini <= fim) &&
          (fimG ? fimG >= inicio : true);

        if (!ativo) return acc;

        const v = Number(g.valor || 0);
        if (g.recorrencia === 'mensal') return acc + v;
        if (g.recorrencia === 'anual') {
          const mesInicio = Number.isNaN(ini.getTime()) ? null : (ini.getMonth() + 1);
          return acc + (mesInicio === mes ? v : 0);
        }
        if (g.recorrencia === 'semanal') return acc + v * semanas;
        return acc;
      }, 0);

      const saldoComFixosMes = saldoFinalMes - totalFixosMes;

      res.render('financeiro', {
        dados,
        totalEntradas: totalEntradasMes.toFixed(2),
        totalSaidas: totalSaidasMes.toFixed(2),
        saldoFinal: saldoFinalMes.toFixed(2),
        gastosFixos,
        totalFixos: totalFixosMes.toFixed(2),
        saldoComFixos: saldoComFixosMes.toFixed(2),
        ano,
        mes
      });
    } catch (error) {
      console.error("Erro ao listar financeiro:", error);
      res.status(500).send("Erro ao carregar os dados financeiros.");
    }
  },

  formCreate: async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) return res.redirect('/login');
      res.render('financeiro-create');
    } catch (error) {
      console.error("Erro ao abrir formulário:", error);
      res.status(500).send("Erro ao abrir o formulário.");
    }
  },

  criar: async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) return res.redirect('/login');

      const { tipo, categoria, valor, data } = req.body;
      await Financeiro.create({ tipo, categoria, valor, data }, userId);

      if (req.is('application/json')) {
        return res.status(200).json({ success: true });
      }
      res.redirect('/financeiro');
    } catch (error) {
      console.error("Erro ao criar lançamento:", error);
      if (req.is('application/json')) {
        return res.status(500).json({ success: false, message: 'Erro ao criar lançamento financeiro.' });
      }
      res.status(500).send("Erro ao criar lançamento financeiro.");
    }
  },

  atualizar: async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) return res.redirect('/login');

      await Financeiro.update(req.params.id, req.body, userId);
      res.redirect('/financeiro');
    } catch (error) {
      console.error("Erro ao atualizar lançamento:", error);
      res.status(500).send("Erro ao atualizar lançamento.");
    }
  },

  deletar: async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) return res.redirect('/login');

      await Financeiro.delete(req.params.id, userId);
      res.redirect('/financeiro');
    } catch (error) {
      console.error("Erro ao deletar lançamento:", error);
      res.status(500).send("Erro ao deletar lançamento.");
    }
  }
};
