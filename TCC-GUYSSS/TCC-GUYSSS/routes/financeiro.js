const router = require('express').Router();
const controller = require('../controllers/financeiro/financeiroController');

router.get('/', controller.listar);

router.get('/create', controller.formCreate);
router.post('/create', controller.criar);
router.post('/update/:id', controller.atualizar);
router.post('/delete/:id', controller.deletar);

module.exports = router;
