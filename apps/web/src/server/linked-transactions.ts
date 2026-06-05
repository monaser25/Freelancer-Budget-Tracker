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

export const getClientTransactionDate = (
  client: Pick<ClientLike, 'paymentType' | 'paymentDate' | 'billingDay' | 'nextBillingDate'>,
) => {
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

const ONE_TIME_TX_PREFIX = 'auto-client-onetime-';

/**
 * Keep a one-time client's single income transaction in sync with the client
 * row. Retainer clients are billed per period through `recordClientPayment`, so
 * they are intentionally left untouched here.
 *
 * Without this, creating a one-time client never produced a transaction, so the
 * client always showed "$0 total paid" and contributed nothing to revenue.
 */
export const syncOneTimeClientTransaction = async (
  tx: Prisma.TransactionClient,
  userId: string,
  client: Pick<ClientLike, 'id' | 'name' | 'revenue' | 'status' | 'paymentType' | 'paymentDate' | 'billingDay' | 'nextBillingDate'> & {
    archivedAt?: Date | string | null;
  },
) => {
  // This helper owns exactly one row: the one-time payment, addressed by a
  // deterministic id. Retainer payments use `auto-client-<id>-<date>` ids and
  // are managed by recordClientPayment, so they can never be matched — or
  // deleted — here.
  const id = `${ONE_TIME_TX_PREFIX}${client.id}`;
  const existing = await tx.transaction.findUnique({ where: { id } });

  const wanted =
    client.paymentType === 'onetime' &&
    !client.archivedAt &&
    shouldHaveClientTransaction(client) &&
    client.revenue > 0;

  if (!wanted) {
    if (existing) {
      await tx.transaction.delete({ where: { id } });
      await tx.client.update({ where: { id: client.id }, data: { transactionId: null, recorded: false } });
    }
    return null;
  }

  const dateKey = getClientTransactionDate(client);
  const date = toDate(dateKey)!;
  const status = dateKey <= todayKey() ? 'COMPLETED' : 'PENDING';
  const name = `${client.name} one-time payment`;

  const saved = await tx.transaction.upsert({
    where: { id },
    create: {
      id,
      userId,
      name,
      amount: client.revenue,
      type: 'INCOME',
      status,
      date,
      notes: name,
      sourceType: 'client',
      sourceId: client.id,
      sourceBillingDate: date,
      clientId: client.id,
      categoryId: 'CLIENT',
      isAuto: true,
    },
    update: {
      name,
      amount: client.revenue,
      status,
      date,
      sourceBillingDate: date,
      clientId: client.id,
      categoryId: 'CLIENT',
      deletedAt: null,
    },
  });

  await tx.client.update({ where: { id: client.id }, data: { transactionId: saved.id, recorded: true } });
  return saved;
};
