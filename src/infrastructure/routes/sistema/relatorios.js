const express = require('express');
const router = express.Router();
const relatoriosController = require('../../../controllers/relatorios/relatoriosController');

router.get('/', relatoriosController.renderRelatorio);

module.exports = router;
