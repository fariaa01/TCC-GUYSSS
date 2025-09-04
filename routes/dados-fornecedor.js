const express = require('express');
const router = express.Router();
const fornecedorController = require('../controllers/fornecedorController');

router.get('/' ,fornecedorController.listar);

module.exports = router;
