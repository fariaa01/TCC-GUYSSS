const express = require('express');
const router = express.Router();
const funcionarioController = require('../controllers/funcionarioController');
const upload = require('../middlewares/upload');

router.get('/', funcionarioController.listar);
router.post('/create', upload.single('foto'), funcionarioController.criar);
router.post('/edit/:id', funcionarioController.atualizar);
router.get('/delete/:id', funcionarioController.deletar);

module.exports = router;
