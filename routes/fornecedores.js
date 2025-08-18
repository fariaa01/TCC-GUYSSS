const router = require('express').Router();
const fornecedorController = require('../controllers/fornecedorController');

router.post('/create', fornecedorController.create);

module.exports = router;
