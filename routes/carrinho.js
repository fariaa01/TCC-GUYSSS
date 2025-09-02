// routes/carrinho.js
const express = require('express');
const router = express.Router();
const requireCliente = require('../middlewares/requireCliente');
const carrinhoCtrl = require('../controllers/carrinhoController');

// Todas as rotas do carrinho exigem cliente logado.
// IMPORTANTe: para chamadas AJAX, o requireCliente deve responder 401 JSON (sem redirect).
router.get('/',         requireCliente, carrinhoCtrl.getCarrinho);
router.post('/adicionar',  requireCliente, carrinhoCtrl.adicionarItem);
router.post('/atualizar',  requireCliente, carrinhoCtrl.atualizarItem);
router.post('/remover',    requireCliente, carrinhoCtrl.removerItem);
router.post('/finalizar',  requireCliente, carrinhoCtrl.finalizar);

module.exports = router;
