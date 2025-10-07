const db = require('../../../db');

const PedidoModel = {
  async criarPedido({ nome_cliente, prato_id, quantidade, preco_total, status_pedido = 'pendente', observacoes, usuario_id }) {
    const [result] = await db.execute(
      `INSERT INTO pedidos (nome_cliente, prato_id, quantidade, preco_total, status_pedido, observacoes, usuario_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [nome_cliente, prato_id, quantidade, preco_total, status_pedido, observacoes, usuario_id]
    );
    return result.insertId;
  },

  async listarPedidosPorUsuario(usuario_id) {
    const [rows] = await db.execute(
      `SELECT p.id, p.nome_cliente, pr.nome AS nome_prato, p.quantidade, p.preco_total, 
              p.status_pedido, p.observacoes, p.data_pedido
       FROM pedidos p
       JOIN pratos pr ON p.prato_id = pr.id
       WHERE p.usuario_id = ?
       ORDER BY p.data_pedido DESC`,
      [usuario_id]
    );
    return rows;
  },

  async atualizarStatus(id, novoStatus) {
    const [result] = await db.execute(
      `UPDATE pedidos SET status_pedido = ? WHERE id = ?`,
      [novoStatus, id]
    );
    return result.affectedRows > 0;
  },

  async deletarPedido(id) {
    const [result] = await db.execute(
      `DELETE FROM pedidos WHERE id = ?`,
      [id]
    );
    return result.affectedRows > 0;
  }
};

module.exports = PedidoModel;
