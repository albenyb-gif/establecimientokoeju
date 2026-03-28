const express = require('express');
const router = express.Router();
const ExpenseController = require('../controllers/expenseController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/resumen', ExpenseController.getSummary);
router.get('/', ExpenseController.getAll);
router.post('/', ExpenseController.create);
router.delete('/:id', ExpenseController.delete);

module.exports = router;
