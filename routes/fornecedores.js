const router = require('express').Router();
const fornecedorController = require('../controllers/fornecedorController');

router.post('/create', fornecedorController.create);
router.post('/:id/update', fornecedorController.update);
//router.get('/delete/:id', fornecedorController.delete);

module.exports = router;
