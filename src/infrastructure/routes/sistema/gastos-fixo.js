const express = require('express');
const router = express.Router();
const gastosFixosController = require('../../../controllers/sistema/financeiro/gastos-fixosController');

router.get('/', gastosFixosController.list);
router.get('/:id', gastosFixosController.getById);
router.get('/periodo/ativos', gastosFixosController.listAtivosNoPeriodo);
router.post('/', gastosFixosController.create);
router.put('/:id', gastosFixosController.update);
router.delete('/:id', gastosFixosController.remove);

module.exports = router;

