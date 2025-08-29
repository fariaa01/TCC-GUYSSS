// controllers/carrinhoController.js
const Carrinho = require('../models/carrinhoModel');

module.exports = {
  /** GET /carrinho */
  getCarrinho: async (req, res) => {
    try {
      const data = await Carrinho.getDraftWithItems(req);
      return res.json(data);
    } catch (e) {
      console.error(e);
      return res.status(400).json({ erro: e.message || 'Erro ao buscar carrinho' });
    }
  },

  /** POST /carrinho/itens  { produto_id, nome, preco, qtd } */
  addItem: async (req, res) => {
    try {
      const { produto_id, nome, preco, qtd } = req.body || {};
      if (!produto_id || !nome || preco == null) {
        return res.status(400).json({ erro: 'Dados do item inválidos' });
      }
      await Carrinho.addItem(req, { produto_id, nome, preco, qtd });
      const data = await Carrinho.getDraftWithItems(req);
      return res.json(data);
    } catch (e) {
      console.error(e);
      return res.status(400).json({ erro: e.message || 'Erro ao adicionar item' });
    }
  },

  /** PATCH /carrinho/itens/:id  { quantidade } */
  updateQty: async (req, res) => {
    try {
      const { quantidade } = req.body || {};
      await Carrinho.updateQty(req, Number(req.params.id), Number(quantidade));
      const data = await Carrinho.getDraftWithItems(req);
      return res.json(data);
    } catch (e) {
      console.error(e);
      return res.status(400).json({ erro: e.message || 'Erro ao atualizar item' });
    }
  },

  /** DELETE /carrinho/itens/:id */
  removeItem: async (req, res) => {
    try {
      await Carrinho.removeItem(req, Number(req.params.id));
      const data = await Carrinho.getDraftWithItems(req);
      return res.json(data);
    } catch (e) {
      console.error(e);
      return res.status(400).json({ erro: e.message || 'Erro ao remover item' });
    }
  },

  /** POST /carrinho/checkout  
   * Body: { observacoes?, statusFinal?, contato?: {nome, telefone}, entrega?: {...} }
   */
  checkout: async (req, res) => {
    try {
      const data = await Carrinho.checkout(req, req.body || {});
      return res.json(data);
    } catch (e) {
      let status = 400;
      if (e.needContact) status = 422; // convidado sem nome/telefone
      if (e.needLogin)   status = 401; // algum fluxo que ainda exija login
      console.error(e);
      return res.status(status).json({
        erro: e.message || 'Erro no checkout',
        needContact: !!e.needContact,
        needLogin: !!e.needLogin
      });
    }
  },
};
