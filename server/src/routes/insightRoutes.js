import express from 'express';
import { getInsights, getAiInsights } from '../controllers/insightController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, getInsights);
router.get('/ai', protect, getAiInsights);

export default router;
