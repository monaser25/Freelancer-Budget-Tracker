import { Router } from 'express';
import { z } from 'zod';
import { getAuthUser, getUserId } from '../auth';
import { prisma } from '../db';
import { ensureUser } from '../devUser';
import { asyncHandler } from '../errors';

const router = Router();

const optionalString = z.preprocess(
  (value) => (value === '' || value === null ? undefined : value),
  z.string().optional(),
);

const optionalBillingDay = z.preprocess(
  (value) => (value === '' || value === null ? undefined : value),
  z.coerce.number().int().min(1).max(28).optional(),
);

const billingDay = z.preprocess(
  (value) => (value === '' || value === null ? undefined : value),
  z.coerce.number().int().min(1).max(28).default(1),
);

const sourceTypeSchema = z.enum(['manual', 'client', 'client-payment', 'subscription']).transform((value) => (
  value === 'client-payment' ? 'client' : value
));

const ClientSnapshotSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1),
  email: optionalString,
  company: optionalString,
  revenue: z.coerce.number().nonnegative().default(0),
  clientType: z.enum(['INDIVIDUAL', 'COMPANY']).default('COMPANY'),
  status: z.enum(['ACTIVE', 'COMPLETED', 'PROSPECT', 'INACTIVE']).default('ACTIVE'),
  paymentType: z.enum(['onetime', 'retainer']).default('onetime'),
  paymentDate: optionalString,
  billingDay: optionalBillingDay,
  nextBillingDate: optionalString,
  recorded: z.boolean().default(false),
  transactionId: optionalString,
  createdAt: optionalString,
  updatedAt: optionalString,
});

const SubscriptionSnapshotSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1),
  amount: z.coerce.number().positive(),
  cycle: z.enum(['MONTHLY', 'QUARTERLY', 'YEARLY']).default('MONTHLY'),
  notes: optionalString,
  billingDay,
  nextBillingDate: z.string().min(1),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
  transactionId: optionalString,
});

const TransactionSnapshotSchema = z.object({
  id: z.string().min(1),
  amount: z.coerce.number().positive(),
  type: z.enum(['INCOME', 'EXPENSE']),
  status: z.enum(['COMPLETED', 'PENDING']).default('COMPLETED'),
  date: z.string().min(1),
  notes: optionalString,
  sourceType: sourceTypeSchema,
  sourceId: optionalString,
  clientId: optionalString,
  subscriptionId: optionalString,
  categoryId: z.string().min(1),
  isAuto: z.boolean().default(false),
  isEdited: z.boolean().default(false),
});

const SnapshotSchema = z.object({
  clients: z.array(ClientSnapshotSchema),
  subscriptions: z.array(SubscriptionSnapshotSchema),
  transactions: z.array(TransactionSnapshotSchema),
});

type Snapshot = z.infer<typeof SnapshotSchema>;
type SnapshotTransaction = Snapshot['transactions'][number];

const getLinkedTransactionKey = (transaction: SnapshotTransaction) => {
  if (transaction.sourceType === 'client') {
    const clientId = transaction.clientId || transaction.sourceId;
    return clientId ? `client:${clientId}` : null;
  }

  if (transaction.sourceType === 'subscription') {
    const subscriptionId = transaction.subscriptionId || transaction.sourceId;
    return subscriptionId ? `subscription:${subscriptionId}` : null;
  }

  return null;
};

const sanitizeSnapshot = (snapshot: Snapshot): Snapshot => {
  const clientIds = new Set(snapshot.clients.map((client) => client.id));
  const subscriptionIds = new Set(snapshot.subscriptions.map((subscription) => subscription.id));
  const seenTransactionIds = new Set<string>();
  const seenLinkedTransactions = new Set<string>();

  return {
    ...snapshot,
    transactions: snapshot.transactions.filter((transaction) => {
      if (seenTransactionIds.has(transaction.id)) return false;
      seenTransactionIds.add(transaction.id);

      if (transaction.sourceType === 'client' && !clientIds.has(transaction.clientId || transaction.sourceId || '')) return false;
      if (transaction.sourceType === 'subscription' && !subscriptionIds.has(transaction.subscriptionId || transaction.sourceId || '')) return false;

      const key = getLinkedTransactionKey(transaction);
      if (!key) return true;
      if (seenLinkedTransactions.has(key)) return false;
      seenLinkedTransactions.add(key);
      return true;
    }),
  };
};

const toDate = (value?: string) => {
  if (!value) return undefined;
  return value.length === 10 ? new Date(`${value}T12:00:00.000Z`) : new Date(value);
};

router.get('/overview', asyncHandler(async (req, res) => {
  const userId = getUserId(req);

  const [clients, subscriptions, transactions] = await Promise.all([
    prisma.client.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
    prisma.subscription.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
    prisma.transaction.findMany({
      where: { userId, deletedAt: null },
      orderBy: { date: 'desc' },
    }),
  ]);

  res.json({ clients, subscriptions, transactions });
}));

router.post('/snapshot', asyncHandler(async (req, res) => {
  res.status(410).json({ error: 'Snapshot sync is deprecated. Use individual CRUD endpoints instead.' });
}));

export const dashboardRoutes = router;
