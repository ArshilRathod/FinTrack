import express from 'express';
import { createLoanEntry, deleteLoanEntry, getLoans, updateLoanEntry } from '../controllers/loanController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.route('/').get(protect, getLoans).post(protect, createLoanEntry);
router.route('/:id').put(protect, updateLoanEntry).delete(protect, deleteLoanEntry);

export default router;
