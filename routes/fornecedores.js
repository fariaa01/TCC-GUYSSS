const router = require('express').Router();
const fornecedorController = require('../controllers/fornecedorController');

router.post('/create', fornecedorController.create);
router.post('/editar/:id', fornecedorController.editar);
router.post('/deletar/:id', fornecedorController.deletar);


module.exports = router;
