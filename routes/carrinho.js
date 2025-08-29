// routes/carrinho.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/carrinhoController');

// GET /carrinho -> retorna carrinho atual (pedido em rascunho + itens)
router.get('/', ctrl.getCarrinho);

// GET /carrinho/itens -> só itens do carrinho (atalho)
router.get('/itens', ctrl.getCarrinho);

// POST /carrinho/itens -> adiciona item { produto_id, nome, preco, qtd }
router.post('/itens', ctrl.addItem);

// PATCH /carrinho/itens/:id -> atualiza quantidade de um item
router.patch('/itens/:id', ctrl.updateQty);

// DELETE /carrinho/itens/:id -> remove item
router.delete('/itens/:id', ctrl.removeItem);

// POST /carrinho/checkout -> finaliza pedido (convidado ou logado)
router.post('/checkout', ctrl.checkout);

module.exports = router;
