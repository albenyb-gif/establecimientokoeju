const express = require('express');
const router = express.Router();
const agendaController = require('../controllers/agendaController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', agendaController.getAll);
router.get('/upcoming', agendaController.getUpcoming);
router.post('/', agendaController.create);
router.put('/:id', agendaController.update);
router.delete('/:id', agendaController.delete);

module.exports = router;
