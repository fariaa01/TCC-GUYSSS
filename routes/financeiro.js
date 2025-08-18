const router = require('express').Router();
const ctrl = require('../controllers/financeiroController');

router.get('/', ctrl.listar);
router.post('/', ctrl.criar);
router.post('/:id/update', ctrl.atualizar);
router.get('/delete/:id', ctrl.deletar);

module.exports = router;
