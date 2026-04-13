import express from 'express';
import { forgotPassword, googleLogin, login, signup } from '../controllers/authController.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { rateLimit } from '../middleware/rateLimit.js';

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.AUTH_RATE_LIMIT_MAX) || 20,
  keyPrefix: 'auth'
});

router.post('/signup', authLimiter, asyncHandler(signup));
router.post('/login', authLimiter, asyncHandler(login));
router.post('/forgot-password', authLimiter, asyncHandler(forgotPassword));
router.post('/google', authLimiter, asyncHandler(googleLogin));

export default router;
