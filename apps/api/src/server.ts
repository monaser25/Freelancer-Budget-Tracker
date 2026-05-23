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
import { authenticate } from './auth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet());
const allowedOrigins = [process.env.FRONTEND_URL, 'http://localhost:3000'].filter(Boolean) as string[];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX || (process.env.NODE_ENV === 'production' ? 100 : 1000)),
});

app.use('/api', limiter);
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

app.get('/health', asyncHandler(async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ status: 'ok', time: new Date() });
}));

app.use('/api/dashboard', authenticate, dashboardRoutes);
app.use('/api/clients', authenticate, clientRoutes);
app.use('/api/transactions', authenticate, transactionRoutes);
app.use('/api/subscriptions', authenticate, subscriptionRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
