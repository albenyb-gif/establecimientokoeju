const express = require('express');
const router = express.Router();
const AnimalController = require('../controllers/animalController');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');

// Proteger todas las rutas con el middleware de API Key
router.use(authMiddleware);

// Configure multer storage (memory storage for processing with sharp)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// --- SPECIFIC routes FIRST (before /:id wildcard) ---
router.post('/ingreso', upload.single('file'), AnimalController.registrarIngreso);
router.get('/compras', AnimalController.getPurchaseHistory);
router.post('/compras', upload.any(), AnimalController.registrarCompraLote);
router.delete('/compras/:id', AnimalController.deletePurchaseLote);
router.put('/compras/:id', AnimalController.updatePurchaseLote);
router.post('/ventas', AnimalController.registrarVenta);
router.get('/ventas', AnimalController.getSalesHistory);
router.post('/batch-update', AnimalController.batchUpdateIds);
router.post('/import', AnimalController.importMasiva);
router.post('/sync-compras', AnimalController.syncAnimalesFromCompras);
router.get('/categorias', AnimalController.getCategories);
router.post('/categorias', AnimalController.createCategory);
router.post('/migrate-categories', AnimalController.migrateCategories);
router.get('/dashboard', AnimalController.getDashboardStats);
router.get('/panel-stats', AnimalController.getPanelStats);
router.get('/ranking', AnimalController.getGDPRanking);
router.get('/costos', AnimalController.getCostAnalysis);
router.get('/rodeos', AnimalController.getRodeos);
router.get('/', AnimalController.getAnimals);

// --- WILDCARD /:id routes LAST ---
router.get('/:id', AnimalController.getAnimalById);
router.put('/:id', AnimalController.updateAnimal);
router.delete('/:id', AnimalController.deleteAnimal);
router.post('/pesaje/:id', AnimalController.registerWeight);
router.put('/pesaje/:pesajeId', AnimalController.updateWeight);
router.post('/sanidad/:id', AnimalController.registerHealthEvent);
router.get('/:id/historial', AnimalController.getAnimalHistory);
router.post('/movimiento/:id', AnimalController.registerMovement);

// --- Marca (Brand photo) routes ---
router.post('/:id/marcas', upload.single('foto'), AnimalController.uploadMarca);
router.delete('/marcas/:marcaId', AnimalController.deleteMarca);

module.exports = router;
