import express from 'express';
import multer from 'multer';
import { createExpenseEntry, deleteExpenseEntry, getExpenses, updateExpenseEntry, importExpenses } from '../controllers/expenseController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.route('/').get(protect, getExpenses).post(protect, createExpenseEntry);
router.post('/import', protect, upload.single('file'), importExpenses);
router.route('/:id').put(protect, updateExpenseEntry).delete(protect, deleteExpenseEntry);

export default router;
