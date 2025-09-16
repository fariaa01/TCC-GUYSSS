const express = require('express');
const router = express.Router();
const fornecedorController = require('../controllers/fornecedorController');

router.get('/' ,fornecedorController.listar);
router.post('/fornecedores/editar/:id', fornecedorController.editar);
router.post('/fornecedores/deletar/:id', fornecedorController.deletar);

module.exports = router;