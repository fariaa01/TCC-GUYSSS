const router = require('express').Router();
const ctrl = require('../controllers/contasPagarController');

router.get('/', ctrl.index);
router.post('/:id/pagar', ctrl.pagar);
router.post('/gerar-parcelas-mes', ctrl.gerarParcelasMes);

module.exports = router;
