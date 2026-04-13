import jwt from 'jsonwebtoken';
import { findUserById, sanitizeUser } from '../store/dataStore.js';

const userCache = new Map();
const USER_CACHE_TTL_MS = Number(process.env.AUTH_USER_CACHE_TTL_MS) || 5 * 60 * 1000;
const AUTH_DB_TIMEOUT_MS = Number(process.env.AUTH_DB_TIMEOUT_MS) || 5000;

const getCachedUser = (userId) => {
  const cached = userCache.get(userId);
  if (!cached) return null;
  if (cached.expiresAt < Date.now()) {
    userCache.delete(userId);
    return null;
  }
  return cached.user;
};

const setCachedUser = (userId, user) => {
  userCache.set(userId, {
    user,
    expiresAt: Date.now() + USER_CACHE_TTL_MS
  });
};

export const clearUserCache = (userId) => {
  userCache.delete(userId);
};

const withTimeout = (promise, ms) => {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('AUTH_DB_TIMEOUT')), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
};

export const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorized' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const cachedUser = getCachedUser(decoded.userId);

    if (cachedUser) {
      req.user = sanitizeUser(cachedUser);
      return next();
    }

    const user = await withTimeout(findUserById(decoded.userId), AUTH_DB_TIMEOUT_MS);

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    setCachedUser(decoded.userId, user);
    req.user = sanitizeUser(user);
    return next();
  } catch (error) {
    if (error?.message === 'AUTH_DB_TIMEOUT') {
      return res.status(503).json({ message: 'Authentication service is temporarily unavailable' });
    }
    if (error?.name === 'JsonWebTokenError' || error?.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token invalid' });
    }
    return res.status(503).json({ message: 'Authentication service is temporarily unavailable' });
  }
};
