const pool = require('../../../db');
try { Carrinho = require('../../models/vendas/carrinhoModel'); } catch { Carrinho = {}; }

module.exports = {
  getCarrinho: async (req, res) => {
    const clienteId = req.session.clienteId;
    const conn = await pool.getConnection();
    try {
      const pedidoId = await Carrinho.getRascunhoId(clienteId, conn);
      if (!pedidoId) {
        return res.json({ pedidoId: null, itens: [], total: 0 });
      }

      const itens = await Carrinho.listarItensComProduto(pedidoId, conn);
      const total = itens.reduce((acc, it) => acc + Number(it.subtotal || 0), 0);
      res.json({ pedidoId, itens, total });
    } catch (e) {
      console.error('Erro getCarrinho', e);
      res.status(500).json({ error: 'Falha ao carregar carrinho' });
    } finally {
      conn.release();
    }
  },

  adicionarItem: async (req, res) => {
    const clienteId = req.session.clienteId;
    let { produto_id, quantidade = 1, preco } = req.body;

    produto_id = Number(produto_id);
    quantidade = Number(quantidade);

    if (!Number.isFinite(produto_id) || produto_id <= 0 || !Number.isFinite(quantidade) || quantidade <= 0) {
      return res.status(400).json({ error: 'Dados inválidos' });
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const pedidoId = await Carrinho.obterOuCriarRascunhoId(clienteId, conn);

      let precoUnit = await Carrinho.precoProduto(produto_id, conn);

      if ((precoUnit == null || !Number.isFinite(precoUnit)) && Number.isFinite(Number(preco)) && Number(preco) > 0) {
        precoUnit = Number(preco);
      }

      if (precoUnit == null || !Number.isFinite(precoUnit)) {
        await conn.rollback();
        return res.status(404).json({ error: 'Produto não encontrado' });
      }

      const existente = await Carrinho.buscarItemDoPedido(pedidoId, produto_id, conn);
      if (existente) {
        await Carrinho.aumentarQuantidadeItem(existente.id, quantidade, precoUnit, conn);
      } else {
        await Carrinho.inserirItem(pedidoId, produto_id, quantidade, precoUnit, conn);
      }

      await Carrinho.tocarPedido(pedidoId, conn);

      await conn.commit();
      res.json({ sucesso: true, pedidoId });
    } catch (e) {
      await conn.rollback();
      console.error('Erro adicionarItem', e);
      res.status(500).json({ error: 'Falha ao adicionar item' });
    } finally {
      conn.release();
    }
  },

  // POST /carrinho/atualizar
  atualizarItem: async (req, res) => {
    const clienteId = req.session.clienteId;
    const { item_id, quantidade } = req.body;

    if (!item_id || Number(quantidade) <= 0) {
      return res.status(400).json({ error: 'Dados inválidos' });
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const ok = await Carrinho.atualizarQuantidadeItemCliente(clienteId, item_id, Number(quantidade), conn);
      if (ok > 0) {
        // toca o pedido do item
        await conn.query(
          `UPDATE pedidos p
           JOIN pedido_itens pi ON p.id = pi.pedido_id
           SET p.atualizado_em = NOW()
           WHERE pi.id = ?`,
          [item_id]
        );
      }

      await conn.commit();
      res.json({ sucesso: true });
    } catch (e) {
      await conn.rollback();
      console.error('Erro atualizarItem', e);
      res.status(500).json({ error: 'Falha ao atualizar item' });
    } finally {
      conn.release();
    }
  },

  // POST /carrinho/remover
  removerItem: async (req, res) => {
    const clienteId = req.session.clienteId;
    const { item_id } = req.body;

    if (!item_id) {
      return res.status(400).json({ error: 'ID do item obrigatório' });
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const pedidoId = await Carrinho.obterPedidoIdDoItemCliente(clienteId, item_id, conn);
      if (!pedidoId) {
        await conn.rollback();
        return res.status(404).json({ error: 'Item não encontrado' });
      }

      await Carrinho.removerItemPorId(item_id, conn);
      await Carrinho.tocarPedido(pedidoId, conn);

      await conn.commit();
      res.json({ sucesso: true });
    } catch (e) {
      await conn.rollback();
      console.error('Erro removerItem', e);
      res.status(500).json({ error: 'Falha ao remover item' });
    } finally {
      conn.release();
    }
  },

  finalizar: async (req, res) => {
    const clienteId = req.session.clienteId;
    const conn = await pool.getConnection();
    try {
      const pedidoId = await Carrinho.finalizarRascunho(clienteId, conn);
      if (!pedidoId) {
        return res.status(400).json({ error: 'Nenhum carrinho aberto' });
      }
      res.json({ sucesso: true, pedidoId });
    } catch (e) {
      console.error('Erro finalizar', e);
      res.status(500).json({ error: 'Falha ao finalizar pedido' });
    } finally {
      conn.release();
    }
  }
};
