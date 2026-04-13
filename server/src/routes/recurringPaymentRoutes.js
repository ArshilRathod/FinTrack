import express from 'express';
import { createRecurringPaymentEntry, deleteRecurringPaymentEntry, getRecurringPayments, updateRecurringPaymentEntry } from '../controllers/recurringPaymentController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.route('/').get(protect, getRecurringPayments).post(protect, createRecurringPaymentEntry);
router.route('/:id').put(protect, updateRecurringPaymentEntry).delete(protect, deleteRecurringPaymentEntry);

export default router;
