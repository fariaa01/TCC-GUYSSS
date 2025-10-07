const Menu = require('../../models/vendas/menuModel');

module.exports = {
  listarPedidos: async (req, res) => {
    try {
      const usuarioId = req.session.userId;
      if (!usuarioId) return res.redirect('/login');

      const pedidos = await Pedidos.getAllByUsuario(usuarioId);
      // res.render('vendas/pedidos', { pedidos }); // View não encontrada
      res.json({ pedidos }); // Temporário
    } catch (err) {
      console.error('Erro ao listar pedidos:', err);
      res.status(500).send('Erro ao listar pedidos');
    }
  },

  criarPedido: async (req, res) => {
    try {
      const dados = {
        ...req.body,
        usuario_id: req.body.usuario_id 
      };

      await Pedidos.create(dados);
      res.redirect('/pedido/sucesso'); 
    } catch (err) {
      console.error('Erro ao criar pedido:', err);
      res.status(500).send('Erro ao criar pedido');
    }
  },

  atualizarStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status_pedido } = req.body;

      await Pedidos.updateStatus(id, status_pedido);
      res.redirect('/pedidos');
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
      res.status(500).send('Erro ao atualizar status');
    }
  },

  mostrarCardapioCliente: async (req, res) => {
    try {
      const usuario_id = req.params.usuario_id;
      const pratos = await Menu.getMenuByUsuarioId(usuario_id);
      // res.render('vendas/pedidoCliente', { pratos, usuario_id }); // View não encontrada
      res.json({ pratos, usuario_id }); // Temporário
    } catch (err) {
      console.error('Erro ao carregar cardápio:', err);
      res.status(500).send('Erro ao carregar cardápio');
    }
  }
};
