import express from 'express';
import { getSettingsController, updateSettings } from '../controllers/settingsController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.route('/').get(protect, getSettingsController).put(protect, updateSettings);

export default router;
