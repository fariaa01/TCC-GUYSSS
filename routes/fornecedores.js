const express = require('express');
const router = express.Router();
const FornecedorController = require('../controllers/fornecedorController');

router.get('/', FornecedorController.listar);
router.get('/:id', FornecedorController.detalhes);
router.post('/create', FornecedorController.create);
router.post('/:id/update', FornecedorController.update);
router.post('/:id/delete', FornecedorController.delete);

module.exports = router;
