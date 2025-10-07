const pool = require('../../../db');

async function getRascunhoId(clienteId, conn = pool) {
  const [rows] = await conn.query(
    `SELECT id FROM pedidos 
     WHERE cliente_id = ? AND status = 'rascunho'
     ORDER BY id DESC LIMIT 1`,
    [clienteId]
  );
  return rows[0]?.id || null;
}

async function criarRascunho(clienteId, conn = pool) {
  const [ins] = await conn.query(
    `INSERT INTO pedidos (cliente_id, status, criado_em, atualizado_em)
     VALUES (?, 'rascunho', NOW(), NOW())`,
    [clienteId]
  );
  return ins.insertId;
}

async function obterOuCriarRascunhoId(clienteId, conn = pool) {
  const id = await getRascunhoId(clienteId, conn);
  if (id) return id;
  return criarRascunho(clienteId, conn);
}

/**
 * Lista itens do pedido juntando com a TABELA MENU.
 * Expõe "produto_nome" e "imagem" para o front.
 */
async function listarItensComProduto(pedidoId, conn = pool) {
  const [itens] = await conn.query(
    `SELECT 
        pi.id,
        pi.produto_id,
        pi.quantidade,
        pi.preco_unitario,
        (pi.quantidade * pi.preco_unitario) AS subtotal,
        COALESCE(m.nome_prato, m.nome, m.titulo, m.descricao) AS produto_nome,
        m.imagem
     FROM pedido_itens pi
     JOIN menu m ON m.id = pi.produto_id
     WHERE pi.pedido_id = ?`,
    [pedidoId]
  );
  return itens;
}

/**
 * Busca preço atual no MENU (não em produtos).
 * Mantém fallback para nomes de coluna comuns.
 */
async function precoProduto(produtoId, conn = pool) {
  const [rows] = await conn.query(
    `SELECT * FROM menu WHERE id = ? LIMIT 1`,
    [produtoId]
  );
  const prod = rows[0];
  if (!prod) return null;

  const candidates = [
    'preco',
    'preco_venda',
    'preco_unitario',
    'valor',
    'valor_unitario',
    'price',
    'unit_price'
  ];

  let valor = null;
  for (const k of candidates) {
    if (Object.prototype.hasOwnProperty.call(prod, k) && prod[k] != null) {
      valor = Number(prod[k]);
      break;
    }
  }
  return Number.isFinite(valor) ? valor : null;
}

async function buscarItemDoPedido(pedidoId, produtoId, conn = pool) {
  const [rows] = await conn.query(
    `SELECT id, quantidade FROM pedido_itens
     WHERE pedido_id = ? AND produto_id = ?
     LIMIT 1`,
    [pedidoId, produtoId]
  );
  return rows[0] || null;
}

async function aumentarQuantidadeItem(itemId, delta, novoPrecoUnitario, conn = pool) {
  await conn.query(
    `UPDATE pedido_itens
     SET quantidade = quantidade + ?, preco_unitario = ?
     WHERE id = ?`,
    [delta, novoPrecoUnitario, itemId]
  );
}

async function inserirItem(pedidoId, produtoId, quantidade, precoUnitario, conn = pool) {
  await conn.query(
    `INSERT INTO pedido_itens (pedido_id, produto_id, quantidade, preco_unitario)
     VALUES (?, ?, ?, ?)`,
    [pedidoId, produtoId, quantidade, precoUnitario]
  );
}

async function atualizarQuantidadeItemCliente(clienteId, itemId, quantidade, conn = pool) {
  const [result] = await conn.query(
    `UPDATE pedido_itens pi
     JOIN pedidos p ON p.id = pi.pedido_id
     SET pi.quantidade = ?
     WHERE pi.id = ? AND p.cliente_id = ? AND p.status = 'rascunho'`,
    [quantidade, itemId, clienteId]
  );
  return result.affectedRows || 0;
}

async function obterPedidoIdDoItemCliente(clienteId, itemId, conn = pool) {
  const [[row]] = await conn.query(
    `SELECT pi.pedido_id
     FROM pedido_itens pi
     JOIN pedidos p ON p.id = pi.pedido_id
     WHERE pi.id = ? AND p.cliente_id = ? AND p.status = 'rascunho'
     LIMIT 1`,
    [itemId, clienteId]
  );
  return row?.pedido_id || null;
}

async function removerItemPorId(itemId, conn = pool) {
  await conn.query(
    `DELETE FROM pedido_itens WHERE id = ?`,
    [itemId]
  );
}

async function tocarPedido(pedidoId, conn = pool) {
  await conn.query(
    `UPDATE pedidos SET atualizado_em = NOW() WHERE id = ?`,
    [pedidoId]
  );
}

async function finalizarRascunho(clienteId, conn = pool) {
  const [pedidos] = await conn.query(
    `SELECT id FROM pedidos 
     WHERE cliente_id = ? AND status = 'rascunho'
     ORDER BY id DESC LIMIT 1`,
    [clienteId]
  );
  if (!pedidos[0]) return null;

  const pedidoId = pedidos[0].id;
  await conn.query(
    `UPDATE pedidos 
     SET status = 'confirmado', atualizado_em = NOW()
     WHERE id = ?`,
    [pedidoId]
  );
  return pedidoId;
}

module.exports = {
  getRascunhoId,
  criarRascunho,
  obterOuCriarRascunhoId,
  listarItensComProduto,
  precoProduto,
  buscarItemDoPedido,
  aumentarQuantidadeItem,
  inserirItem,
  atualizarQuantidadeItemCliente,
  obterPedidoIdDoItemCliente,
  removerItemPorId,
  tocarPedido,
  finalizarRascunho,
};
