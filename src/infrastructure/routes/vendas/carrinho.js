const express = require('express');
const router = express.Router();
const requireCliente = require('../../middlewares/requireCliente');
const carrinhoCtrl = require('../../../controllers/vendas/carrinhoController');

router.get('/',         requireCliente, carrinhoCtrl.getCarrinho);
router.post('/adicionar',  requireCliente, carrinhoCtrl.adicionarItem);
router.post('/atualizar',  requireCliente, carrinhoCtrl.atualizarItem);
router.post('/remover',    requireCliente, carrinhoCtrl.removerItem);
router.post('/finalizar',  requireCliente, carrinhoCtrl.finalizar);

module.exports = router;
