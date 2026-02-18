const express = require('express');
const router = express.Router();
const OvineController = require('../controllers/ovineController');

router.get('/stats', OvineController.getStats);
router.post('/esquila', OvineController.registerShearing);
router.get('/historial-lana', OvineController.getWoolHistory);

module.exports = router;
