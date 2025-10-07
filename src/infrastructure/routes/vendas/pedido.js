const express = require('express');
const router = express.Router();
const pedidoController = require('../../../controllers/vendas/pedidoController');

router.get('/listar', pedidoController.listarPedidos);
router.post('/', pedidoController.criarPedido);

module.exports = router;
