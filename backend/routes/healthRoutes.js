const express = require('express');
const router = express.Router();
const HealthController = require('../controllers/healthController');

// Routes for Insumos
router.get('/insumos', HealthController.getStock);
router.get('/insumos/:id', HealthController.getStockById);
router.post('/insumos', HealthController.createInsumo);
router.put('/insumos/:id', HealthController.updateInsumo);
router.delete('/insumos/:id', HealthController.deleteInsumo);

// Routes for Events
router.get('/eventos', HealthController.getEvents);
// router.post('/eventos/individual', HealthController.createIndividualEvent); // If needed
router.post('/eventos/grupal', HealthController.registerGroupEvent); // The main way to apply to a batch

module.exports = router;
