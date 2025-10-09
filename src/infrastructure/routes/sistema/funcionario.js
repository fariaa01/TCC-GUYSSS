const express = require('express');
const router = express.Router();
const funcionarioController = require('../../../controllers/sistema/funcionarioController');
const upload = require('../../middlewares/upload');

router.get('/', funcionarioController.listar);
router.post('/create', upload.single('foto'), funcionarioController.criar);
router.post('/:id/update', upload.single('foto'), funcionarioController.atualizar);
router.get('/delete/:id', funcionarioController.deletar);

router.get('/historico/:funcionario_id', funcionarioController.obterHistoricoSalarial);
router.post('/reajuste', funcionarioController.criarReajusteSalarial);

module.exports = router;
