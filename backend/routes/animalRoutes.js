const express = require('express');
const router = express.Router();
const AnimalController = require('../controllers/animalController');
const multer = require('multer');

// Configure multer storage (memory storage for processing with sharp)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post('/ingreso', upload.single('file'), AnimalController.registrarIngreso);
router.post('/compras', upload.single('file'), AnimalController.registrarCompraLote);
router.post('/ventas', AnimalController.registrarVenta);
router.post('/batch-update', AnimalController.batchUpdateIds);
router.post('/import', AnimalController.importMasiva);
router.get('/categorias', AnimalController.getCategories);
router.post('/migrate-categories', AnimalController.migrateCategories);
router.get('/dashboard', AnimalController.getDashboardStats);
router.get('/ranking', AnimalController.getGDPRanking);
router.get('/costos', AnimalController.getCostAnalysis);
router.get('/', AnimalController.getAnimals);
router.get('/:id', AnimalController.getAnimalById);
router.put('/:id', AnimalController.updateAnimal);
router.post('/pesaje/:id', AnimalController.registerWeight);
router.post('/sanidad/:id', AnimalController.registerHealthEvent);
router.get('/:id/historial', AnimalController.getAnimalHistory);
router.get('/rodeos', AnimalController.getRodeos);
router.post('/movimiento/:id', AnimalController.registerMovement);

module.exports = router;
