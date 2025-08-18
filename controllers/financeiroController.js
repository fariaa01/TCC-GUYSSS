const Financeiro = require('../models/financeiroModel');
const ContasPagar = require('../models/ContasPagar');
let ContasReceber = null;
try { ContasReceber = require('../models/ContasReceber'); } catch {}

function firstDayOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function parseDateOrNull(v) {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d) ? null : d;
}
function wantsJSON(req) {
  return req.xhr || req.is('application/json') || req.get('accept')?.includes('application/json');
}
function toISODate(d) {
  const x = d instanceof Date ? d : new Date(d);
  const yyyy = x.getFullYear();
  const mm = String(x.getMonth() + 1).padStart(2, '0');
  const dd = String(x.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

module.exports = {
  listar: async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) return res.redirect('/login');

      const empresaId = req.session.empresaId || req.session.userId || null;

      const page = Math.max(1, Number(req.query.page || 1));
      const perPage = Math.min(Number(req.query.perPage || 100), 500);
      const tipo = req.query.tipo || null;
      const categoria = req.query.categoria || null;
      const subcategoria = req.query.subcategoria || null;
      const centro_custo = req.query.centro_custo || null;
      const busca = req.query.q || null;
      const tab = req.query.tab || 'pagar'; 

      let start = parseDateOrNull(req.query.start);
      let end = parseDateOrNull(req.query.end);
      if (!start || !end) {
        start = firstDayOfMonth();
        end = new Date();
      }
      
      const filters = {
        start,
        end,
        tipo,
        categoria,
        subcategoria,
        centro_custo,
        busca,
        page,
        perPage,
        order: 'data DESC, id DESC'
      };
      const { data: dados, total } = await Financeiro.list(empresaId, filters, userId);
      const resumo = await Financeiro.getResumo(empresaId, { start, end }, userId);

      // ===== Contas a Pagar (lista + totais)
      let pagarContas = [];
      let pagarTotais = { previsto: 0, vencido: 0, pago: 0 };
      if (ContasPagar) {
        await ContasPagar.atualizarVencidos(empresaId);
        pagarContas = (await ContasPagar.list(empresaId, { start, end })) || [];
        const t = (await ContasPagar.totaisPorStatus(empresaId, { start, end })) || {};
        pagarTotais = {
          previsto: Number(t.previsto || 0),
          vencido: Number(t.vencido || 0),
          pago: Number(t.pago || 0),
        };
      }

      // ===== Contas a Receber (opcional)
      let receberContas = [];
      let receberTotais = { previsto: 0, vencido: 0, recebido: 0 };
      if (ContasReceber && typeof ContasReceber.list === 'function') {
        if (typeof ContasReceber.atualizarVencidos === 'function') {
          await ContasReceber.atualizarVencidos(empresaId);
        }
        receberContas = (await ContasReceber.list(empresaId, { start, end })) || [];
        const tr = (await ContasReceber.totaisPorStatus(empresaId, { start, end })) || {};
        receberTotais = {
          previsto: Number(tr.previsto || 0),
          vencido: Number(tr.vencido || 0),
          recebido: Number(tr.recebido || 0),
        };
      }

      if (wantsJSON(req)) {
        // Mantém compat com seu JSON atual e agrega as novas seções
        return res.status(200).json({
          dados, total, page, perPage,
          periodo: { start, end },
          ...resumo,
          pagar: { contas: pagarContas, totais: pagarTotais },
          receber: { contas: receberContas, totais: receberTotais }
        });
      }

      // Render da PÁGINA ÚNICA (Hub). Use a view que te mandei: views/financeiro.ejs
      return res.render('financeiro', {
        tab,
        start: toISODate(start),
        end: toISODate(end),
        // KPIs do módulo de lançamentos (se quiser mostrar algo rápido nessa aba)
        totalEntradas: Number(resumo.totalEntradas || 0).toFixed(2),
        totalSaidas: Number(resumo.totalSaidas || 0).toFixed(2),
        saldoFinal: Number(resumo.saldo || 0).toFixed(2),

        // Dados para cada aba:
        pagarContas,
        pagarTotais,
        receberContas,
        receberTotais,
        lancamentos: dados, // <— a aba "Lançamentos" usa esse nome
        // Se sua view ainda espera 'filtros', mantém também:
        filtros: {
          start: toISODate(start),
          end: toISODate(end),
          tipo, categoria, subcategoria, centro_custo, busca, page, perPage
        },
        total
      });
    } catch (error) {
      console.error("Erro ao listar financeiro:", error);
      if (wantsJSON(req)) return res.status(500).json({ success: false, message: 'Erro ao carregar dados financeiros.' });
      res.status(500).send("Erro ao carregar os dados financeiros.");
    }
  },

  // ===== Mantidos como estavam =====
  criar: async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) return res.redirect('/login');
      const empresaId = req.session.empresaId || null;

      const {
        tipo,
        categoria,
        subcategoria = null,
        valor,
        data,
        forma_pagamento = null,
        descricao = null,
        centro_custo = null
      } = req.body;

      await Financeiro.createManual({
        tipo, categoria, subcategoria, valor, data, forma_pagamento, descricao, centro_custo
      }, empresaId, userId);

      if (wantsJSON(req)) return res.status(200).json({ success: true });
      res.redirect('/financeiro');
    } catch (error) {
      console.error("Erro ao criar lançamento:", error);
      if (wantsJSON(req)) return res.status(500).json({ success: false, message: 'Erro ao criar lançamento financeiro.' });
      res.status(500).send("Erro ao criar lançamento financeiro.");
    }
  },

  atualizar: async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) return res.redirect('/login');
      const empresaId = req.session.empresaId || null;

      const id = req.params.id;
      const {
        tipo,
        categoria,
        subcategoria = null,
        valor,
        data,
        forma_pagamento = null,
        descricao = null,
        centro_custo = null
      } = req.body;

      await Financeiro.updateManual(
        id,
        { tipo, categoria, subcategoria, valor, data, forma_pagamento, descricao, centro_custo },
        empresaId,
        userId
      );

      if (wantsJSON(req)) return res.status(200).json({ success: true });
      res.redirect('/financeiro');
    } catch (error) {
      console.error("Erro ao atualizar lançamento:", error);
      if (wantsJSON(req)) return res.status(500).json({ success: false, message: 'Erro ao atualizar lançamento.' });
      res.status(500).send("Erro ao atualizar lançamento.");
    }
  },

  deletar: async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) return res.redirect('/login');
      const empresaId = req.session.empresaId || null;

      await Financeiro.delete(req.params.id, empresaId, userId);

      if (wantsJSON(req)) return res.status(200).json({ success: true });
      res.redirect('/financeiro');
    } catch (error) {
      console.error("Erro ao deletar lançamento:", error);
      const msg = error?.message?.includes('conciliado') 
        ? 'Não é possível excluir: lançamento conciliado (origem).'
        : 'Erro ao deletar lançamento.';
      if (wantsJSON(req)) return res.status(400).json({ success: false, message: msg });
      res.status(400).send(msg);
    }
  }
};
