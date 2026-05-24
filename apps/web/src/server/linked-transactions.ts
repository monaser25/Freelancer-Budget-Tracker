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
