import express from 'express';
import { getEducationTopics } from '../controllers/educationController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, getEducationTopics);

export default router;
