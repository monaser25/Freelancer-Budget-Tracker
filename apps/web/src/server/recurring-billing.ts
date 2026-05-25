import { Prisma } from '@prisma/client';
import { HttpError } from './errors';
import { prisma } from './prisma';

export const toDate = (value?: string | Date | null) => {
  if (!value) return undefined;
  if (value instanceof Date) return value;
  return value.length === 10 ? new Date(`${value}T12:00:00.000Z`) : new Date(value);
};

export const dateKey = (value: Date | string) => {
  const date = typeof value === 'string' ? toDate(value) : value;
  return (date || new Date()).toISOString().slice(0, 10);
};

export const todayKey = () => dateKey(new Date());

export const addMonths = (value: Date | string, months: number) => {
  const current = toDate(value) || new Date();
  const next = new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth() + months, current.getUTCDate(), 12));
  return next;
};

export const advanceBillingDate = (value: Date | string, cycle: string) => {
  if (cycle === 'YEARLY') return addMonths(value, 12);
  if (cycle === 'QUARTERLY') return addMonths(value, 3);
  return addMonths(value, 1);
};

const generatedTransactionWhere = (userId: string, sourceType: 'client' | 'subscription', sourceId: string, billingDate: Date) => ({
  userId,
  sourceType,
  sourceId,
  OR: [
    { sourceBillingDate: billingDate },
    { date: billingDate },
  ],
});

const ensureGeneratedTransaction = async (
  tx: Prisma.TransactionClient,
  params: {
    userId: string;
    sourceType: 'client' | 'subscription';
    sourceId: string;
    sourceBillingDate: Date;
    name: string;
    amount: number;
    type: 'INCOME' | 'EXPENSE';
    categoryId: string;
    clientId?: string;
    subscriptionId?: string;
  },
) => {
  const existing = await tx.transaction.findFirst({
    where: generatedTransactionWhere(params.userId, params.sourceType, params.sourceId, params.sourceBillingDate),
  });
  if (existing) return existing;

  try {
    return await tx.transaction.create({
      data: {
        id: `auto-${params.sourceType}-${params.sourceId}-${dateKey(params.sourceBillingDate)}`,
        userId: params.userId,
        name: params.name,
        amount: params.amount,
        type: params.type,
        status: 'COMPLETED',
        date: params.sourceBillingDate,
        notes: params.name,
        sourceType: params.sourceType,
        sourceId: params.sourceId,
        sourceBillingDate: params.sourceBillingDate,
        clientId: params.clientId,
        subscriptionId: params.subscriptionId,
        categoryId: params.categoryId,
        isAuto: true,
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return tx.transaction.findFirstOrThrow({
        where: generatedTransactionWhere(params.userId, params.sourceType, params.sourceId, params.sourceBillingDate),
      });
    }
    throw err;
  }
};

export const recordClientPayment = async (
  tx: Prisma.TransactionClient,
  userId: string,
  clientId: string,
  today: Date | string = new Date(),
) => {
  const client = await tx.client.findFirst({ where: { id: clientId, userId, archivedAt: null } });
  if (!client) throw new HttpError(404, 'Client not found');
  if (client.paymentType !== 'retainer') throw new HttpError(400, 'Only monthly retainer clients can record recurring payments');
  if (client.status !== 'ACTIVE') throw new HttpError(400, 'Only active clients can record recurring payments');

  const billingDate = toDate(client.nextBillingDate) || toDate(today) || new Date();
  const transaction = await ensureGeneratedTransaction(tx, {
    userId,
    sourceType: 'client',
    sourceId: client.id,
    sourceBillingDate: billingDate,
    name: `${client.name} retainer payment`,
    amount: client.revenue,
    type: 'INCOME',
    categoryId: 'CLIENT',
    clientId: client.id,
  });
  const updatedClient = await tx.client.update({
    where: { id: client.id },
    data: { nextBillingDate: advanceBillingDate(billingDate, 'MONTHLY') },
  });

  return { transaction, client: updatedClient };
};

export const recordSubscriptionPayment = async (
  tx: Prisma.TransactionClient,
  userId: string,
  subscriptionId: string,
  today: Date | string = new Date(),
) => {
  const subscription = await tx.subscription.findFirst({ where: { id: subscriptionId, userId, archivedAt: null } });
  if (!subscription) throw new HttpError(404, 'Subscription not found');
  if (subscription.status !== 'ACTIVE') throw new HttpError(400, 'Only active subscriptions can record payments');

  const billingDate = toDate(subscription.nextBillingDate) || toDate(today) || new Date();
  const cycle = subscription.billingCycle || subscription.cycle;
  const transaction = await ensureGeneratedTransaction(tx, {
    userId,
    sourceType: 'subscription',
    sourceId: subscription.id,
    sourceBillingDate: billingDate,
    name: `${subscription.name} subscription payment`,
    amount: subscription.amount,
    type: 'EXPENSE',
    categoryId: 'TOOLS',
    subscriptionId: subscription.id,
  });
  const updatedSubscription = await tx.subscription.update({
    where: { id: subscription.id },
    data: { nextBillingDate: advanceBillingDate(billingDate, cycle) },
  });

  return { transaction, subscription: updatedSubscription };
};

export const runDueRecurringPaymentsInTransaction = async (
  tx: Prisma.TransactionClient,
  userId: string,
  today: Date | string = new Date(),
) => {
  const dueThrough = toDate(today) || new Date();
  const clients = await tx.client.findMany({
    where: {
      userId,
      paymentType: 'retainer',
      status: 'ACTIVE',
      archivedAt: null,
      nextBillingDate: { lte: dueThrough },
    },
  });
  const subscriptions = await tx.subscription.findMany({
    where: {
      userId,
      status: 'ACTIVE',
      archivedAt: null,
      nextBillingDate: { lte: dueThrough },
    },
  });

  for (const client of clients) {
    let nextBillingDate = toDate(client.nextBillingDate) || dueThrough;
    while (nextBillingDate <= dueThrough) {
      await ensureGeneratedTransaction(tx, {
        userId,
        sourceType: 'client',
        sourceId: client.id,
        sourceBillingDate: nextBillingDate,
        name: `${client.name} retainer payment`,
        amount: client.revenue,
        type: 'INCOME',
        categoryId: 'CLIENT',
        clientId: client.id,
      });
      nextBillingDate = advanceBillingDate(nextBillingDate, 'MONTHLY');
    }
    await tx.client.update({ where: { id: client.id }, data: { nextBillingDate } });
  }

  for (const subscription of subscriptions) {
    let nextBillingDate = toDate(subscription.nextBillingDate) || dueThrough;
    const cycle = subscription.billingCycle || subscription.cycle;
    while (nextBillingDate <= dueThrough) {
      await ensureGeneratedTransaction(tx, {
        userId,
        sourceType: 'subscription',
        sourceId: subscription.id,
        sourceBillingDate: nextBillingDate,
        name: `${subscription.name} subscription payment`,
        amount: subscription.amount,
        type: 'EXPENSE',
        categoryId: 'TOOLS',
        subscriptionId: subscription.id,
      });
      nextBillingDate = advanceBillingDate(nextBillingDate, cycle);
    }
    await tx.subscription.update({ where: { id: subscription.id }, data: { nextBillingDate } });
  }
};

export const runDueRecurringPayments = async (userId: string, today: Date | string = new Date()) => {
  return prisma.$transaction((tx) => runDueRecurringPaymentsInTransaction(tx, userId, today));
};
