import { Router } from 'express';
import { z } from 'zod';
import { getAuthUser, getUserId } from '../auth';
import { prisma } from '../db';
import { ensureUser } from '../devUser';
import { asyncHandler, HttpError } from '../errors';

const router = Router();

const optionalString = z.preprocess(
  (value) => (value === '' || value === null ? undefined : value),
  z.string().optional(),
);

const toDate = (value?: string) => {
  if (!value) return undefined;
  return value.length === 10 ? new Date(`${value}T12:00:00.000Z`) : new Date(value);
};

const TransactionSchema = z.object({
  amount: z.coerce.number().positive(),
  type: z.enum(['INCOME', 'EXPENSE']),
  status: z.enum(['COMPLETED', 'PENDING']).default('COMPLETED'),
  date: z.string().min(1),
  notes: optionalString,
  sourceType: z.enum(['manual', 'client', 'client-payment', 'subscription']).transform((value) => (
    value === 'client-payment' ? 'client' : value
  )),
  sourceId: optionalString,
  clientId: optionalString,
  subscriptionId: optionalString,
  categoryId: z.string().min(1),
  isAuto: z.boolean().optional(),
  isEdited: z.boolean().optional(),
});

router.get('/list', asyncHandler(async (req, res) => {
  const userId = getUserId(req);
  const transactions = await prisma.transaction.findMany({
    where: { userId, deletedAt: null },
    orderBy: { date: 'desc' },
  });

  res.json(transactions);
}));

router.post('/create', asyncHandler(async (req, res) => {
  const user = getAuthUser(req);
  const userId = user.id;
  const validated = TransactionSchema.parse(req.body);

  if (validated.sourceType !== 'manual') {
    throw new HttpError(400, 'Only manual transactions can be created directly');
  }

  await ensureUser(user);

  const tx = await prisma.transaction.create({
    data: {
      ...validated,
      date: toDate(validated.date) || new Date(),
      userId,
    },
  });

  res.status(201).json(tx);
}));

router.put('/update/:id', asyncHandler(async (req, res) => {
  const userId = getUserId(req);
  const validated = TransactionSchema.partial().parse(req.body);

  const existing = await prisma.transaction.findFirst({
    where: { id: req.params.id, userId, deletedAt: null }
  });

  if (!existing) throw new HttpError(404, 'Transaction not found');
  if (existing.sourceType !== 'manual') {
    throw new HttpError(400, 'Linked transactions cannot be edited directly');
  }

  const result = await prisma.transaction.updateMany({
    where: { id: req.params.id, userId, deletedAt: null },
    data: {
      ...validated,
      date: validated.date ? toDate(validated.date) : undefined,
      isEdited: existing.isAuto ? true : validated.isEdited ?? existing.isEdited,
    },
  });

  const tx = await prisma.transaction.findFirst({ where: { id: req.params.id, userId } });
  res.json(tx);
}));

router.delete('/delete/:id', asyncHandler(async (req, res) => {
  const userId = getUserId(req);
  
  const existing = await prisma.transaction.findFirst({
    where: { id: req.params.id, userId, deletedAt: null }
  });

  if (!existing) throw new HttpError(404, 'Transaction not found');
  if (existing.sourceType !== 'manual') {
    throw new HttpError(400, 'Linked transactions cannot be deleted directly');
  }

  const result = await prisma.transaction.deleteMany({
    where: { id: req.params.id, userId },
  });

  res.json({ success: true });
}));

export const transactionRoutes = router;
