const express = require('express');
const router = express.Router();
const cliente = require('../../../controllers/autenticacao/clienteController');

router.get('/api/cliente/status', cliente.status);

router.post('/cliente/login', cliente.login);
router.post('/cliente/cadastrar', cliente.cadastrar);
router.post('/cliente/logout', cliente.logout);

module.exports = router;
