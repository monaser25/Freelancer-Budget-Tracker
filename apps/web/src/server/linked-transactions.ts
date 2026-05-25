import { Prisma } from '@prisma/client';

type ClientLike = {
  id: string;
  name: string;
  revenue: number;
  status: string;
  paymentType: string;
  paymentDate: Date | string | null;
  billingDay: number | null;
  nextBillingDate: Date | string | null;
  transactionId: string | null;
};

export const toDate = (value?: string) => {
  if (!value) return undefined;
  return value.length === 10 ? new Date(`${value}T12:00:00.000Z`) : new Date(value);
};

export const todayKey = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

export const computeNextBillingDate = (billingDay: number, from = new Date()) => {
  const safeDay = Math.max(1, Math.min(28, billingDay || 1));
  const candidate = new Date(from.getFullYear(), from.getMonth(), safeDay, 12);
  const today = new Date(from.getFullYear(), from.getMonth(), from.getDate(), 12);

  if (candidate >= today) return candidate.toISOString().slice(0, 10);
  return new Date(from.getFullYear(), from.getMonth() + 1, safeDay, 12).toISOString().slice(0, 10);
};

export const getClientTransactionDate = (client: ClientLike) => {
  if (client.paymentType === 'retainer') {
    const nextDate = client.nextBillingDate;
    if (nextDate) return typeof nextDate === 'string' ? nextDate.slice(0, 10) : nextDate.toISOString().slice(0, 10);
    return computeNextBillingDate(client.billingDay || 1);
  }
  const payDate = client.paymentDate;
  if (payDate) return typeof payDate === 'string' ? payDate.slice(0, 10) : payDate.toISOString().slice(0, 10);
  return todayKey();
};

export const shouldHaveClientTransaction = (client: Pick<ClientLike, 'status'>) => (
  client.status !== 'PROSPECT' && client.status !== 'INACTIVE'
);

export const clientLinkedTransactionWhere = (userId: string, clientId: string): Prisma.TransactionWhereInput => ({
  userId,
  OR: [
    { clientId },
    { sourceType: 'client', sourceId: clientId },
    { sourceType: 'client-payment', sourceId: clientId },
  ],
});

export const subscriptionLinkedTransactionWhere = (userId: string, subscriptionId: string): Prisma.TransactionWhereInput => ({
  userId,
  OR: [
    { subscriptionId },
    { sourceType: 'subscription', sourceId: subscriptionId },
  ],
});

type SubscriptionLike = {
  id: string;
  name: string;
  amount: number;
  status: string;
  nextBillingDate: Date | string;
  transactionId: string | null;
};

type LinkedTransaction = {
  id: string;
};

const preferredLinkedTransaction = <T extends LinkedTransaction>(transactions: T[], transactionId?: string | null) => (
  (transactionId ? transactions.find((transaction) => transaction.id === transactionId) : undefined) || transactions[0]
);

const deleteDuplicateLinkedTransactions = async (
  tx: Prisma.TransactionClient,
  userId: string,
  transactions: LinkedTransaction[],
  primaryId?: string,
) => {
  const duplicateIds = transactions
    .filter((transaction) => transaction.id !== primaryId)
    .map((transaction) => transaction.id);

  if (duplicateIds.length === 0) return;

  await tx.transaction.deleteMany({
    where: {
      userId,
      id: { in: duplicateIds },
    },
  });
};

export const reconcileClientLinkedTransaction = async (
  tx: Prisma.TransactionClient,
  userId: string,
  client: ClientLike,
) => {
  if (!shouldHaveClientTransaction(client)) {
    await tx.transaction.deleteMany({ where: clientLinkedTransactionWhere(userId, client.id) });
    if (client.transactionId) {
      await tx.client.update({ where: { id: client.id }, data: { transactionId: null } });
    }
    return;
  }

  const linkedTransactions = await tx.transaction.findMany({
    where: clientLinkedTransactionWhere(userId, client.id),
    orderBy: [{ createdAt: 'asc' }],
  });
  const primary = preferredLinkedTransaction(linkedTransactions, client.transactionId);
  const dateKey = getClientTransactionDate(client);
  const data = {
    amount: client.revenue,
    type: 'INCOME',
    status: client.paymentType === 'onetime' && dateKey <= todayKey() ? 'COMPLETED' : 'PENDING',
    date: toDate(dateKey) || new Date(),
    notes: client.paymentType === 'retainer' ? `${client.name} retainer` : `${client.name} one-time payment`,
    sourceType: 'client',
    sourceId: client.id,
    clientId: client.id,
    categoryId: 'CLIENT',
    isAuto: true,
    deletedAt: null,
  };

  if (primary) {
    await deleteDuplicateLinkedTransactions(tx, userId, linkedTransactions, primary.id);
    await tx.transaction.update({ where: { id: primary.id }, data });
    if (client.transactionId !== primary.id) {
      await tx.client.update({ where: { id: client.id }, data: { transactionId: primary.id } });
    }
    return;
  }

  const created = await tx.transaction.create({
    data: {
      ...data,
      id: client.paymentType === 'retainer' ? `auto-client-retainer-${client.id}` : `auto-client-onetime-${client.id}`,
      userId,
    },
  });
  await tx.client.update({ where: { id: client.id }, data: { transactionId: created.id } });
};

export const reconcileSubscriptionLinkedTransaction = async (
  tx: Prisma.TransactionClient,
  userId: string,
  subscription: SubscriptionLike,
) => {
  if (subscription.status !== 'ACTIVE') {
    await tx.transaction.deleteMany({ where: subscriptionLinkedTransactionWhere(userId, subscription.id) });
    if (subscription.transactionId) {
      await tx.subscription.update({ where: { id: subscription.id }, data: { transactionId: null } });
    }
    return;
  }

  const linkedTransactions = await tx.transaction.findMany({
    where: subscriptionLinkedTransactionWhere(userId, subscription.id),
    orderBy: [{ createdAt: 'asc' }],
  });
  const primary = preferredLinkedTransaction(linkedTransactions, subscription.transactionId);
  const nextBillingDate = typeof subscription.nextBillingDate === 'string' ? toDate(subscription.nextBillingDate) || new Date() : subscription.nextBillingDate;
  const data = {
    amount: subscription.amount,
    type: 'EXPENSE',
    status: 'COMPLETED',
    date: nextBillingDate,
    notes: `Subscription: ${subscription.name}`,
    sourceType: 'subscription',
    sourceId: subscription.id,
    subscriptionId: subscription.id,
    categoryId: 'TOOLS',
    isAuto: true,
    deletedAt: null,
  };

  if (primary) {
    await deleteDuplicateLinkedTransactions(tx, userId, linkedTransactions, primary.id);
    await tx.transaction.update({ where: { id: primary.id }, data });
    if (subscription.transactionId !== primary.id) {
      await tx.subscription.update({ where: { id: subscription.id }, data: { transactionId: primary.id } });
    }
    return;
  }

  const dateKey = nextBillingDate.toISOString().slice(0, 10);
  const created = await tx.transaction.create({
    data: {
      ...data,
      id: `auto-sub-${subscription.id}-${dateKey}`,
      userId,
    },
  });
  await tx.subscription.update({ where: { id: subscription.id }, data: { transactionId: created.id } });
};

export const reconcileLinkedTransactions = async (tx: Prisma.TransactionClient, userId: string) => {
  const [clients, subscriptions] = await Promise.all([
    tx.client.findMany({ where: { userId } }),
    tx.subscription.findMany({ where: { userId } }),
  ]);

  for (const client of clients) {
    await reconcileClientLinkedTransaction(tx, userId, client);
  }

  for (const subscription of subscriptions) {
    await reconcileSubscriptionLinkedTransaction(tx, userId, subscription);
  }
};
