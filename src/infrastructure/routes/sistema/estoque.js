const express = require('express');
const router = express.Router();
const estoqueCtrl = require('../../../controllers/sistema/estoque/estoqueController');

router.get('/', estoqueCtrl.listar);
router.post('/create', estoqueCtrl.criar);
router.post('/:id/update', estoqueCtrl.atualizar);
router.post('/:id/movimento', estoqueCtrl.movimento);
router.get('/delete/:id', estoqueCtrl.deletar);

router.get('/produto/:id', estoqueCtrl.visualizar);

module.exports = router;
