// routes/clienteRoutes.js
const express = require('express');
const router = express.Router();
const cliente = require('../controllers/clienteController');

// Status de login (front usa para confirmar sessão pós login/cadastro)
router.get('/api/cliente/status', cliente.status);

// Login / Cadastro / Logout
router.post('/cliente/login', cliente.login);
router.post('/cliente/cadastrar', cliente.cadastrar);
router.post('/cliente/logout', cliente.logout);

module.exports = router;
