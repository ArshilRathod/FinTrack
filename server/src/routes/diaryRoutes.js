import express from 'express';
import { 
  getDiaries, 
  createNewDiary, 
  getSingleDiary, 
  updateExistingDiary, 
  removeDiary,
  addExpensesToDiary,
  getUntrackedExpenses
} from '../controllers/diaryController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
  .get(protect, getDiaries)
  .post(protect, createNewDiary);

router.get('/untracked-expenses', protect, getUntrackedExpenses);

router.route('/:id')
  .get(protect, getSingleDiary)
  .put(protect, updateExistingDiary)
  .delete(protect, removeDiary);

router.post('/:id/expenses', protect, addExpensesToDiary);

export default router;
