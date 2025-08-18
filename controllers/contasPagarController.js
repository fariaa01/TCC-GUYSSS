// controllers/contasPagarController.js
const ContasPagar = require('../models/ContasPagar');
const Financeiro = require('../models/financeiroModel');
const fixedSvc = require('../services/fixedExpenseService');

function firstDayOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

module.exports = {
  async index(req, res, next) {
    try {
      const empresaId = req.session.empresaId || req.session.userId || null;

      const start = req.query.start ? new Date(req.query.start) : firstDayOfMonth();
      const end   = req.query.end   ? new Date(req.query.end)   : new Date();

      await ContasPagar.atualizarVencidos(empresaId);

      const contasRaw  = await ContasPagar.list(empresaId, { start, end });
      const totaisRaw  = await ContasPagar.totaisPorStatus(empresaId, { start, end });

      const contas = Array.isArray(contasRaw) ? contasRaw : [];
      const totais = {
        previsto: Number(totaisRaw?.previsto || 0),
        vencido:  Number(totaisRaw?.vencido  || 0),
        pago:     Number(totaisRaw?.pago     || 0),
      };

      return res.render('contasPagar', { contas, totais, start, end });
    } catch (err) {
      return next ? next(err) : res.status(500).send('Erro ao carregar Contas a Pagar');
    }
  },

  async pagar(req, res, next) {
    try {
      const empresaId = req.session.empresaId || req.session.userId || null;
      const id = req.params.id;
      const forma_pagamento = req.body.forma_pagamento || null;

      const conta = await ContasPagar.marcarPago(id, {
        forma_pagamento,
        dataPagamento: new Date(),
      });
      
      const pertenceAoOwner =
        (!!conta && ((conta.empresa_id && conta.empresa_id === empresaId) ||
                     (conta.usuario_id && conta.usuario_id === empresaId)));

      if (!conta || !pertenceAoOwner) {
        return res.status(404).send('Não encontrada');
      }

      await Financeiro.lancarSaidaDeContaPagar(empresaId, conta);
      await ContasPagar.conciliar(id);

      return res.redirect('/financeiro?ok=pagou');
    } catch (err) {
      return next ? next(err) : res.status(500).send('Erro ao pagar conta');
    }
  },

  async gerarParcelasMes(req, res, next) {
    try {
      const empresaId = req.session.empresaId || req.session.userId || null;
      await fixedSvc.gerarParcelasDoMes(empresaId, new Date());
      return res.redirect('/contas-a-pagar?ok=gerado');
    } catch (err) {
      return next ? next(err) : res.status(500).send('Erro ao gerar parcelas do mês');
    }
  }
};
