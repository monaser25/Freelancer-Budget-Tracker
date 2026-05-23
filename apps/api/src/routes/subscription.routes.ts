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

const billingDay = z.preprocess(
  (value) => (value === '' || value === null ? undefined : value),
  z.coerce.number().int().min(1).max(28).default(1),
);

const toDate = (value?: string) => {
  if (!value) return undefined;
  return value.length === 10 ? new Date(`${value}T12:00:00.000Z`) : new Date(value);
};

const SubscriptionSchema = z.object({
  name: z.string().trim().min(1),
  amount: z.coerce.number().positive(),
  cycle: z.enum(['MONTHLY', 'QUARTERLY', 'YEARLY']).default('MONTHLY'),
  notes: optionalString,
  billingDay,
  nextBillingDate: z.string().min(1),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
  transactionId: optionalString,
});

router.get('/', asyncHandler(async (req, res) => {
  const userId = getUserId(req);
  const subscriptions = await prisma.subscription.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  res.json(subscriptions);
}));

router.post('/create', asyncHandler(async (req, res) => {
  const user = getAuthUser(req);
  const userId = user.id;
  const validated = SubscriptionSchema.parse(req.body);

  await ensureUser(user);

  const sub = await prisma.$transaction(async (tx) => {
    const newSub = await tx.subscription.create({
      data: {
        ...validated,
        nextBillingDate: toDate(validated.nextBillingDate) || new Date(),
        userId,
      },
    });

    if (newSub.status === 'ACTIVE') {
      const transactionId = newSub.transactionId || `auto-sub-${newSub.id}-${newSub.nextBillingDate.toISOString().slice(0, 10)}`;
      const newTx = await tx.transaction.create({
        data: {
          id: transactionId,
          userId,
          amount: newSub.amount,
          type: 'EXPENSE',
          status: 'COMPLETED',
          date: newSub.nextBillingDate,
          notes: `Subscription: ${newSub.name}`,
          sourceType: 'subscription',
          sourceId: newSub.id,
          subscriptionId: newSub.id,
          categoryId: 'TOOLS',
          isAuto: true,
        }
      });
      if (!newSub.transactionId) {
        await tx.subscription.update({
          where: { id: newSub.id },
          data: { transactionId: newTx.id }
        });
        newSub.transactionId = newTx.id;
      }
    }

    return newSub;
  });

  res.status(201).json(sub);
}));

router.put('/update/:id', asyncHandler(async (req, res) => {
  const userId = getUserId(req);
  const validated = SubscriptionSchema.partial().parse(req.body);

  const dataToUpdate = {
    ...validated,
    nextBillingDate: validated.nextBillingDate !== undefined ? toDate(validated.nextBillingDate) : undefined,
  };

  const sub = await prisma.$transaction(async (tx) => {
    const existingSub = await tx.subscription.findFirst({ where: { id: req.params.id, userId } });
    if (!existingSub) throw new HttpError(404, 'Subscription not found');

    const updatedSub = await tx.subscription.update({
      where: { id: req.params.id },
      data: dataToUpdate,
    });

    if (updatedSub.status === 'ACTIVE') {
      const txData = {
        amount: updatedSub.amount,
        date: updatedSub.nextBillingDate,
        notes: `Subscription: ${updatedSub.name}`,
        deletedAt: null,
      };

      const existingTx = await tx.transaction.findFirst({
        where: {
          userId,
          OR: [
            { subscriptionId: updatedSub.id },
            { sourceType: 'subscription', sourceId: updatedSub.id },
          ],
        }
      });

      if (existingTx) {
        await tx.transaction.update({
          where: { id: existingTx.id },
          data: txData,
        });
        if (!updatedSub.transactionId || updatedSub.transactionId !== existingTx.id) {
          await tx.subscription.update({ where: { id: updatedSub.id }, data: { transactionId: existingTx.id } });
          updatedSub.transactionId = existingTx.id;
        }
      } else {
        const transactionId = updatedSub.transactionId || `auto-sub-${updatedSub.id}-${updatedSub.nextBillingDate.toISOString().slice(0, 10)}`;
        const newTx = await tx.transaction.create({
          data: {
            ...txData,
            id: transactionId,
            userId,
            type: 'EXPENSE',
            sourceType: 'subscription',
            sourceId: updatedSub.id,
            subscriptionId: updatedSub.id,
            categoryId: 'TOOLS',
            isAuto: true,
            status: 'COMPLETED',
          }
        });
        await tx.subscription.update({ where: { id: updatedSub.id }, data: { transactionId: newTx.id } });
        updatedSub.transactionId = newTx.id;
      }
    } else {
      await tx.transaction.deleteMany({
        where: {
          userId,
          OR: [
            { subscriptionId: updatedSub.id },
            { sourceType: 'subscription', sourceId: updatedSub.id },
          ],
        }
      });
      if (updatedSub.transactionId) {
        await tx.subscription.update({ where: { id: updatedSub.id }, data: { transactionId: null } });
        updatedSub.transactionId = null;
      }
    }

    return updatedSub;
  });

  res.json(sub);
}));

router.delete('/delete/:id', asyncHandler(async (req, res) => {
  const userId = getUserId(req);

  const result = await prisma.$transaction(async (tx) => {
    await tx.transaction.deleteMany({
      where: {
        userId,
        OR: [
          { subscriptionId: req.params.id },
          { sourceType: 'subscription', sourceId: req.params.id },
        ],
      },
    });

    return tx.subscription.deleteMany({ where: { id: req.params.id, userId } });
  });

  if (result.count === 0) throw new HttpError(404, 'Subscription not found');

  res.json({ success: true });
}));

export const subscriptionRoutes = router;
