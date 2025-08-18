const router = require('express').Router();
const produtoController = require('../controllers/produtoController');

router.post('/create', produtoController.create);

module.exports = router;
