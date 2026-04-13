const now = () => Date.now();

const store = new Map();

const getKey = (req, keyPrefix) => {
  const ip = req.ip || req.connection?.remoteAddress || 'unknown';
  return `${keyPrefix}:${ip}`;
};

export const rateLimit = ({ windowMs, max, keyPrefix }) => {
  const windowMsSafe = Number(windowMs) || 60000;
  const maxSafe = Number(max) || 10;
  const prefix = keyPrefix || 'rl';

  return (req, res, next) => {
    const key = getKey(req, prefix);
    const entry = store.get(key);
    const timestamp = now();

    if (!entry || timestamp - entry.start >= windowMsSafe) {
      store.set(key, { start: timestamp, count: 1 });
      res.setHeader('X-RateLimit-Limit', String(maxSafe));
      res.setHeader('X-RateLimit-Remaining', String(maxSafe - 1));
      return next();
    }

    entry.count += 1;
    const remaining = Math.max(0, maxSafe - entry.count);
    res.setHeader('X-RateLimit-Limit', String(maxSafe));
    res.setHeader('X-RateLimit-Remaining', String(remaining));

    if (entry.count > maxSafe) {
      const retryAfter = Math.ceil((windowMsSafe - (timestamp - entry.start)) / 1000);
      res.setHeader('Retry-After', String(retryAfter));
      return res.status(429).json({
        message: 'Too many requests. Please try again later.',
        requestId: req.requestId
      });
    }

    return next();
  };
};
