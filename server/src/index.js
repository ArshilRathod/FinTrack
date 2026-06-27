import './loadEnv.js';
import cors from 'cors';
import express from 'express';
import morgan from 'morgan';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import authRoutes from './routes/authRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import educationRoutes from './routes/educationRoutes.js';
import expenseRoutes from './routes/expenseRoutes.js';
import insightRoutes from './routes/insightRoutes.js';
import loanRoutes from './routes/loanRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import recurringPaymentRoutes from './routes/recurringPaymentRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import diaryRoutes from './routes/diaryRoutes.js';
import { requestId } from './middleware/requestId.js';

const app = express();
const PORT = process.env.PORT || 5001;
const HOST = process.env.HOST || (process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1');
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDistPath = path.resolve(__dirname, '../../client/dist');

if (!process.env.JWT_SECRET) {
  throw new Error('Missing JWT_SECRET in server environment');
}

const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173'
].filter(Boolean);

const isAllowedLocalDevOrigin = (origin) => {
  try {
    const url = new URL(origin);
    const isLocalHost = ['localhost', '127.0.0.1'].includes(url.hostname);
    const port = Number(url.port);

    return isLocalHost && Number.isInteger(port) && port >= 5173 && port <= 5199;
  } catch {
    return false;
  }
};

const isAllowedRenderOrigin = (origin) => {
  try {
    return process.env.NODE_ENV === 'production' && new URL(origin).hostname.endsWith('.onrender.com');
  } catch {
    return false;
  }
};

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || isAllowedLocalDevOrigin(origin) || isAllowedRenderOrigin(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    }
  })
);
app.use(requestId);
app.use(express.json());
morgan.token('request-id', (req) => req.requestId || '-');

const HTTP_LOG_LEVEL = process.env.HTTP_LOG_LEVEL || 'errors';
const shouldSkipHttpLog = (req, res) => {
  if (HTTP_LOG_LEVEL === 'none') return true;
  if (HTTP_LOG_LEVEL === 'all') return false;

  // "errors" mode (default): keep the console focused on problems.
  if (req.method === 'OPTIONS') return true;
  if (req.path === '/api/health') return true;
  return res.statusCode < 400;
};

app.use(
  morgan(':method :url :status :res[content-length] - :response-time ms :request-id', {
    skip: shouldSkipHttpLog
  })
);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', mode: 'production', date: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/recurring-payments', recurringPaymentRoutes);
app.use('/api/education', educationRoutes);
app.use('/api/insights', insightRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/diaries', diaryRoutes);

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(clientDistPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

app.use((error, req, res, _next) => {
  console.error(`[${req.requestId}]`, error);
  if (error?.code === 'ECONNREFUSED') {
    return res.status(503).json({ message: 'Database connection failed. Check Supabase DATABASE_URL.', requestId: req.requestId });
  }

  res.status(500).json({ message: error?.message || 'Internal server error', requestId: req.requestId });
});

app.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}`);
});
