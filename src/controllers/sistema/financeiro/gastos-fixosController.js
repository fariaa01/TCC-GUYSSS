const gastosFixosModel = require('../../../models/sistema/financeiro/gastos-fixosModel');

module.exports = {
  list: async (req, res) => {
    try {
      const userId = req.session.userId; if (!userId) return res.redirect('/login');
      const dados = await gastosFixosModel.getAll(userId);
      res.json({ sucesso: true, dados });
    } catch (e) {
      console.error(e); res.status(500).json({ sucesso: false, erro: 'Falha ao listar gastos fixos' });
    }
  },

  getById: async (req, res) => {
    try {
      const userId = req.session.userId; if (!userId) return res.redirect('/login');
      const dado = await gastosFixosModel.getById(req.params.id, userId);
      if (!dado) return res.status(404).json({ sucesso: false, erro: 'Não encontrado' });
      res.json({ sucesso: true, dado });
    } catch (e) {
      console.error(e); res.status(500).json({ sucesso: false, erro: 'Falha ao buscar gasto fixo' });
    }
  },

  listAtivosNoPeriodo: async (req, res) => {
    try {
      const userId = req.session.userId; if (!userId) return res.redirect('/login');
      const { inicio, fim } = req.query;
      if (!inicio || !fim) return res.status(400).json({ sucesso: false, erro: 'inicio e fim são obrigatórios' });
      const dados = await gastosFixosModel.getAtivosNoPeriodo(inicio, fim, userId);
      res.json({ sucesso: true, dados });
    } catch (e) {
      console.error(e); res.status(500).json({ sucesso: false, erro: 'Falha ao listar por período' });
    }
  },

  create: async (req, res) => {
    try {
      const userId = req.session.userId; if (!userId) return res.redirect('/login');
      const { nome, valor, data_inicio } = req.body || {};
      if (!nome || valor === undefined || !data_inicio) {
        if (!req.is('application/json')) return res.redirect('/financeiro');
        return res.status(400).json({ sucesso: false, erro: 'Campos obrigatórios: nome, valor, data_inicio' });
      }
      await gastosFixosModel.create(req.body, userId);
      if (!req.is('application/json')) return res.redirect('/financeiro');
      res.status(201).json({ sucesso: true });
    } catch (e) {
      console.error(e);
      if (!req.is('application/json')) return res.redirect('/financeiro');
      res.status(500).json({ sucesso: false, erro: 'Falha ao criar gasto fixo' });
    }
  },

  update: async (req, res) => {
    try {
      const userId = req.session.userId; if (!userId) return res.redirect('/login');
      await gastosFixosModel.update(req.params.id, req.body || {}, userId);
      res.json({ sucesso: true });
    } catch (e) {
      console.error(e); res.status(500).json({ sucesso: false, erro: 'Falha ao atualizar gasto fixo' });
    }
  },

  remove: async (req, res) => {
    try {
      const userId = req.session.userId; if (!userId) return res.redirect('/login');
      await gastosFixosModel.delete(req.params.id, userId);
      res.json({ sucesso: true });
    } catch (e) {
      console.error(e); res.status(500).json({ sucesso: false, erro: 'Falha ao remover gasto fixo' });
    }
  },
};
