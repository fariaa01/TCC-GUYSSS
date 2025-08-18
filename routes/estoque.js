const express = require('express');
const router = express.Router();
const estoqueController = require('../controllers/estoqueController');

router.get('/', estoqueController.listar);
router.post('/create', estoqueController.criar);
router.post('/edit/:id', estoqueController.atualizar);
router.get('/delete/:id', estoqueController.deletar);

module.exports = router;
