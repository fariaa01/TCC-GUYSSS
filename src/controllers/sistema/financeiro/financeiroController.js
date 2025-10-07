const Financeiro = require('../../../models/sistema/financeiro/financeiroModel');
const GastosFixos = require('../../../models/sistema/financeiro/gastos-fixosModel');

function pegarPeriodo(req) {
  const agora = new Date();
  const anoEscolhido = Number(req.query.ano || agora.getFullYear());
  const mesEscolhido = Number(req.query.mes || (agora.getMonth() + 1));

  const inicioMes = new Date(anoEscolhido, mesEscolhido - 1, 1);
  const fimMes = new Date(anoEscolhido, mesEscolhido, 0);

  return { anoEscolhido, mesEscolhido, inicioMes, fimMes };
}

function semanasNoMes(ano, mes) {
  const primeiroDia = new Date(ano, mes - 1, 1);
  const ultimoDia = new Date(ano, mes, 0);
  const dias = Math.floor((ultimoDia - primeiroDia) / (1000 * 60 * 60 * 24)) + 1;
  const semanasAprox = Math.round(dias / 7);
  return semanasAprox > 0 ? semanasAprox : 4;
}

module.exports = {
  listar: async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) return res.redirect('/login');

      const { anoEscolhido, mesEscolhido, inicioMes, fimMes } = pegarPeriodo(req);
      const todosLancamentos = await Financeiro.getAll(userId) || [];

      const lancamentosDoMes = todosLancamentos.filter((item) => {
        const d = new Date(item.data);
        if (Number.isNaN(d.getTime())) {
          const s = String(item.data).slice(0, 10);
          const y = anoEscolhido;
          const m = String(mesEscolhido).padStart(2, '0');
          const ultimoDia = String(fimMes.getDate()).padStart(2, '0');
          return s >= `${y}-${m}-01` && s <= `${y}-${m}-${ultimoDia}`;
        }
        return d >= inicioMes && d <= fimMes;
      });

      let totalEntradasMes = 0;
      let totalSaidasMes = 0;

      for (const l of lancamentosDoMes) {
        const valor = Number(l.valor || 0);
        if (l.tipo === 'entrada') totalEntradasMes += valor;
        if (l.tipo === 'saida')   totalSaidasMes   += valor;
      }

      const saldoFinalMes = totalEntradasMes - totalSaidasMes;
      const listaFixos = await GastosFixos.getAll(userId) || [];
      const semanas = semanasNoMes(anoEscolhido, mesEscolhido);

      let totalFixosMes = 0;

      for (const g of listaFixos) {
        const inicioFixo = g.data_inicio ? new Date(g.data_inicio) : null;
        const fimFixo = g.data_fim ? new Date(g.data_fim) : null;

        let ativo = true;
        if (inicioFixo && !Number.isNaN(inicioFixo.getTime())) {
          ativo = inicioFixo <= fimMes;
        }
        if (ativo && fimFixo && !Number.isNaN(fimFixo.getTime())) {
          ativo = fimFixo >= inicioMes;
        }
        if (!ativo) continue;

        const v = Number(g.valor || 0);

        if (g.recorrencia === 'mensal') {
          totalFixosMes += v;
        } else if (g.recorrencia === 'anual') {
          const mesDoInicio = inicioFixo && !Number.isNaN(inicioFixo.getTime())
            ? (inicioFixo.getMonth() + 1)
            : null;
          if (mesDoInicio === mesEscolhido) totalFixosMes += v;
        } else if (g.recorrencia === 'semanal') {
          totalFixosMes += v * semanas;
        }
      }

      const saldoComFixosMes = saldoFinalMes - totalFixosMes;

      return res.render('sistema/financeiro', {
        dados: todosLancamentos,
        totalEntradas: totalEntradasMes.toFixed(2),
        totalSaidas: totalSaidasMes.toFixed(2),
        saldoFinal: saldoFinalMes.toFixed(2),
        gastosFixos: listaFixos,
        totalFixos: totalFixosMes.toFixed(2),
        saldoComFixos: saldoComFixosMes.toFixed(2),
        ano: anoEscolhido,
        mes: mesEscolhido
      });
    } catch (err) {
      console.error('Erro ao listar financeiro:', err);
      return res.status(500).send('Erro ao carregar os dados financeiros.');
    }
  },

  formCreate: async (req, res) => {
    try {
      if (!req.session.userId) return res.redirect('/login');
      // return res.render('sistema/financeiro-create'); // View não encontrada
      return res.json({ message: 'Página de criação financeira' }); // Temporário
    } catch (err) {
      console.error('Erro ao abrir formulário:', err);
      return res.status(500).send('Erro ao abrir o formulário.');
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
      return res.redirect('/financeiro');
    } catch (err) {
      console.error('Erro ao criar lançamento:', err);
      if (req.is('application/json')) {
        return res.status(500).json({ success: false, message: 'Erro ao criar lançamento financeiro.' });
      }
      return res.status(500).send('Erro ao criar lançamento financeiro.');
    }
  },

  atualizar: async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) return res.redirect('/login');

      await Financeiro.update(req.params.id, req.body, userId);
      return res.redirect('/financeiro');
    } catch (err) {
      console.error('Erro ao atualizar lançamento:', err);
      return res.status(500).send('Erro ao atualizar lançamento.');
    }
  },

  deletar: async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) return res.redirect('/login');

      await Financeiro.delete(req.params.id, userId);
      return res.redirect('/financeiro');
    } catch (err) {
      console.error('Erro ao deletar lançamento:', err);
      return res.status(500).send('Erro ao deletar lançamento.');
    }
  }
};
