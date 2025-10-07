
const express = require('express');
const router = express.Router();
const dashboardController = require('../../../controllers/sistema/dashboardController');

router.get('/', dashboardController.renderDashboard);

module.exports = router;
