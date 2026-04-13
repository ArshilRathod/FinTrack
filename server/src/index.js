import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import morgan from 'morgan';
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

dotenv.config({
  path: fileURLToPath(new URL('../.env', import.meta.url)),
  override: true
});

const app = express();
const PORT = process.env.PORT || 5001;
const HOST = process.env.HOST || '127.0.0.1';

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

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || isAllowedLocalDevOrigin(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    }
  })
);
app.use(requestId);
app.use(express.json());
morgan.token('request-id', (req) => req.requestId || '-');
app.use(morgan(':method :url :status :res[content-length] - :response-time ms :request-id'));

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
