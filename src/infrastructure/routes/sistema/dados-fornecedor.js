const express = require('express');
const router = express.Router();
const fornecedorController = require('../../../controllers/sistema/fornecedorController');

router.get('/' ,fornecedorController.listar);
router.post('/', fornecedorController.delete)

module.exports = router;
