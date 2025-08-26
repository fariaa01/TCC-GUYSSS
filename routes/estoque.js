const express = require('express');
const router = express.Router();
const estoqueCtrl = require('../controllers/estoqueController');

router.get('/', estoqueCtrl.listar);
router.post('/create', estoqueCtrl.criar);
router.post('/:id/update', estoqueCtrl.atualizar);
router.get('/delete/:id', estoqueCtrl.deletar);

module.exports = router;
