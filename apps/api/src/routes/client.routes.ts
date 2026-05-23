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

const optionalEmail = z.preprocess(
  (value) => (value === '' || value === null ? undefined : value),
  z.string().email().optional(),
);

const optionalBillingDay = z.preprocess(
  (value) => (value === '' || value === null ? undefined : value),
  z.coerce.number().int().min(1).max(28).optional(),
);

const toDate = (value?: string) => {
  if (!value) return undefined;
  return value.length === 10 ? new Date(`${value}T12:00:00.000Z`) : new Date(value);
};

const ClientSchema = z.object({
  name: z.string().trim().min(1),
  email: optionalEmail,
  company: optionalString,
  revenue: z.coerce.number().nonnegative().default(0),
  clientType: z.enum(['INDIVIDUAL', 'COMPANY']).default('COMPANY'),
  status: z.enum(['ACTIVE', 'COMPLETED', 'PROSPECT', 'INACTIVE']).default('ACTIVE'),
  paymentType: z.enum(['onetime', 'retainer']).default('onetime'),
  paymentDate: optionalString,
  billingDay: optionalBillingDay,
  nextBillingDate: optionalString,
  recorded: z.boolean().optional(),
  transactionId: optionalString,
});

const todayKey = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

const toIsoDate = (date: string) => new Date(`${date.slice(0, 10)}T12:00:00`).toISOString();

const computeNextBillingDate = (billingDay: number, from = new Date()) => {
  const safeDay = Math.max(1, Math.min(28, billingDay || 1));
  const candidate = new Date(from.getFullYear(), from.getMonth(), safeDay, 12);
  const today = new Date(from.getFullYear(), from.getMonth(), from.getDate(), 12);

  if (candidate >= today) return candidate.toISOString().slice(0, 10);
  return new Date(from.getFullYear(), from.getMonth() + 1, safeDay, 12).toISOString().slice(0, 10);
};

const getClientTransactionDate = (client: any) => {
  if (client.paymentType === 'retainer') {
    const nextDate = client.nextBillingDate;
    if (nextDate) return typeof nextDate === 'string' ? nextDate.slice(0, 10) : nextDate.toISOString().slice(0, 10);
    return computeNextBillingDate(client.billingDay || 1);
  }
  const payDate = client.paymentDate;
  if (payDate) return typeof payDate === 'string' ? payDate.slice(0, 10) : payDate.toISOString().slice(0, 10);
  return todayKey();
};

const shouldHaveClientTransaction = (client: any) => client.status !== 'PROSPECT' && client.status !== 'INACTIVE';

router.get('/', asyncHandler(async (req, res) => {
  const userId = getUserId(req);
  const clients = await prisma.client.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  res.json(clients);
}));

router.post('/create', asyncHandler(async (req, res) => {
  const user = getAuthUser(req);
  const userId = user.id;
  const validated = ClientSchema.parse(req.body);

  await ensureUser(user);

  const client = await prisma.$transaction(async (tx) => {
    const newClient = await tx.client.create({
      data: {
        ...validated,
        paymentDate: toDate(validated.paymentDate),
        nextBillingDate: toDate(validated.nextBillingDate),
        userId,
      },
    });

    if (shouldHaveClientTransaction(newClient)) {
      const dateKey = getClientTransactionDate(newClient);
      const transactionId = newClient.transactionId || (newClient.paymentType === 'retainer' ? `auto-client-retainer-${newClient.id}` : `auto-client-onetime-${newClient.id}`);
      
      const newTx = await tx.transaction.create({
        data: {
          id: transactionId,
          userId,
          amount: newClient.revenue,
          type: 'INCOME',
          status: newClient.paymentType === 'onetime' && dateKey <= todayKey() ? 'COMPLETED' : 'PENDING',
          date: toDate(dateKey) || new Date(),
          notes: newClient.paymentType === 'retainer' ? `${newClient.name} retainer` : `${newClient.name} one-time payment`,
          sourceType: 'client',
          sourceId: newClient.id,
          clientId: newClient.id,
          categoryId: 'CLIENT',
          isAuto: true,
        }
      });

      if (!newClient.transactionId) {
        await tx.client.update({
          where: { id: newClient.id },
          data: { transactionId: newTx.id }
        });
        newClient.transactionId = newTx.id;
      }
    }

    return newClient;
  });

  res.status(201).json(client);
}));

router.put('/update/:id', asyncHandler(async (req, res) => {
  const userId = getUserId(req);
  const validated = ClientSchema.partial().parse(req.body);

  const dataToUpdate = {
    ...validated,
    paymentDate: validated.paymentDate !== undefined ? toDate(validated.paymentDate) : undefined,
    nextBillingDate: validated.nextBillingDate !== undefined ? toDate(validated.nextBillingDate) : undefined,
  };

  const client = await prisma.$transaction(async (tx) => {
    const existingClient = await tx.client.findFirst({ where: { id: req.params.id, userId } });
    if (!existingClient) throw new HttpError(404, 'Client not found');

    const updatedClient = await tx.client.update({
      where: { id: req.params.id },
      data: dataToUpdate,
    });

    const hasTx = shouldHaveClientTransaction(updatedClient);
    
    // update linked tx
    if (hasTx) {
      const dateKey = getClientTransactionDate(updatedClient);
      const txData = {
        amount: updatedClient.revenue,
        date: toDate(dateKey) || new Date(),
        notes: updatedClient.paymentType === 'retainer' ? `${updatedClient.name} retainer` : `${updatedClient.name} one-time payment`,
        status: updatedClient.paymentType === 'onetime' && dateKey <= todayKey() ? 'COMPLETED' : 'PENDING',
        deletedAt: null, // restore if it was deleted
      };

      const existingTx = await tx.transaction.findFirst({
        where: {
          userId,
          OR: [
            { clientId: updatedClient.id },
            { sourceType: 'client', sourceId: updatedClient.id },
            { sourceType: 'client-payment', sourceId: updatedClient.id },
          ],
        }
      });

      if (existingTx) {
        await tx.transaction.update({
          where: { id: existingTx.id },
          data: txData,
        });
        if (!updatedClient.transactionId || updatedClient.transactionId !== existingTx.id) {
          await tx.client.update({ where: { id: updatedClient.id }, data: { transactionId: existingTx.id } });
          updatedClient.transactionId = existingTx.id;
        }
      } else {
        const transactionId = updatedClient.transactionId || (updatedClient.paymentType === 'retainer' ? `auto-client-retainer-${updatedClient.id}` : `auto-client-onetime-${updatedClient.id}`);
        const newTx = await tx.transaction.create({
          data: {
            ...txData,
            id: transactionId,
            userId,
            type: 'INCOME',
            sourceType: 'client',
            sourceId: updatedClient.id,
            clientId: updatedClient.id,
            categoryId: 'CLIENT',
            isAuto: true,
          }
        });
        await tx.client.update({ where: { id: updatedClient.id }, data: { transactionId: newTx.id } });
        updatedClient.transactionId = newTx.id;
      }
    } else {
      // remove tx
      await tx.transaction.deleteMany({
        where: {
          userId,
          OR: [
            { clientId: updatedClient.id },
            { sourceType: 'client', sourceId: updatedClient.id },
            { sourceType: 'client-payment', sourceId: updatedClient.id },
          ],
        }
      });
      if (updatedClient.transactionId) {
        await tx.client.update({ where: { id: updatedClient.id }, data: { transactionId: null } });
        updatedClient.transactionId = null;
      }
    }

    return updatedClient;
  });

  res.json(client);
}));

router.delete('/delete/:id', asyncHandler(async (req, res) => {
  const userId = getUserId(req);

  const result = await prisma.$transaction(async (tx) => {
    await tx.transaction.deleteMany({
      where: {
        userId,
        OR: [
          { clientId: req.params.id },
          { sourceType: 'client', sourceId: req.params.id },
          { sourceType: 'client-payment', sourceId: req.params.id },
        ],
      },
    });

    return tx.client.deleteMany({ where: { id: req.params.id, userId } });
  });

  if (result.count === 0) throw new HttpError(404, 'Client not found');

  res.json({ success: true });
}));

router.get('/:id/transaction-count', asyncHandler(async (req, res) => {
  const userId = getUserId(req);

  const count = await prisma.transaction.count({
    where: {
      userId,
      deletedAt: null,
      OR: [
        { clientId: req.params.id },
        { sourceType: 'client', sourceId: req.params.id },
        { sourceType: 'client-payment', sourceId: req.params.id },
      ],
    },
  });

  res.json({ count });
}));

export const clientRoutes = router;
