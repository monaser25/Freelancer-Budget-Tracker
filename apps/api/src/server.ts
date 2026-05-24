import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { clientRoutes } from './routes/client.routes';
import { dashboardRoutes } from './routes/dashboard.routes';
import { transactionRoutes } from './routes/transaction.routes';
import { subscriptionRoutes } from './routes/subscription.routes';
import { asyncHandler, errorHandler } from './errors';
import { prisma } from './db';
import { AuthenticatedRequest, authenticate } from './auth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet());
const allowedOrigins = [
  process.env.FRONTEND_URL?.replace(/\/+$/, ''),
].filter(Boolean) as string[];

const isDevLocalhostOrigin = (origin: string) => {
  if (process.env.NODE_ENV === 'production') return false;

  try {
    const url = new URL(origin);
    return url.protocol === 'http:' && (url.hostname === 'localhost' || url.hostname === '127.0.0.1');
  } catch {
    return false;
  }
};

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || isDevLocalhostOrigin(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error('Origin not allowed by CORS'));
  },
  credentials: true,
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX || (process.env.NODE_ENV === 'production' ? 100 : 1000)),
  keyGenerator: (req) => (req as AuthenticatedRequest).user?.id || req.ip || req.socket.remoteAddress || 'unknown',
});

app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

app.get('/health', asyncHandler(async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ status: 'ok', time: new Date() });
}));

app.use('/api/dashboard', authenticate, limiter, dashboardRoutes);
app.use('/api/clients', authenticate, limiter, clientRoutes);
app.use('/api/transactions', authenticate, limiter, transactionRoutes);
app.use('/api/subscriptions', authenticate, limiter, subscriptionRoutes);

app.use(errorHandler);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export { app };
