import { Client, Subscription, Transaction } from '@/types/finance';

const makeId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const normalizeSourceType = (sourceType: Transaction['sourceType'] | 'client-payment') => {
  return sourceType === 'client-payment' ? 'client' : sourceType;
};

const toIsoDate = (date: string) => new Date(`${date.slice(0, 10)}T12:00:00`).toISOString();

export const getLinkedTransactionKey = (transaction: Transaction) => {
  const sourceType = normalizeSourceType(transaction.sourceType as Transaction['sourceType'] | 'client-payment');
  const dateKey = transaction.date.slice(0, 10);

  if (sourceType === 'client') {
    const clientId = transaction.clientId || transaction.sourceId;
    return clientId ? `client:${clientId}:${dateKey}` : null;
  }

  if (sourceType === 'subscription') {
    const subscriptionId = transaction.subscriptionId || transaction.sourceId;
    return subscriptionId ? `subscription:${subscriptionId}:${dateKey}` : null;
  }

  return null;
};

export const dedupeLinkedTransactions = (transactions: Transaction[]) => {
  const seen = new Set<string>();

  return transactions.filter((transaction) => {
    const key = getLinkedTransactionKey(transaction);
    if (!key) return true;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export const isClientTransaction = (transaction: Transaction, clientId: string) => {
  return (
    transaction.clientId === clientId ||
    (normalizeSourceType(transaction.sourceType as Transaction['sourceType'] | 'client-payment') === 'client' && transaction.sourceId === clientId)
  );
};

export const isLinkedClientTransaction = (transaction: Transaction, client: Client) => {
  return Boolean(
    (client.transactionId && transaction.id === client.transactionId) ||
      transaction.clientId === client.id ||
      (normalizeSourceType(transaction.sourceType as Transaction['sourceType'] | 'client-payment') === 'client' && transaction.sourceId === client.id),
  );
};

export const isSubscriptionTransaction = (transaction: Transaction, subscriptionId: string) => {
  return (
    transaction.subscriptionId === subscriptionId ||
    (transaction.sourceType === 'subscription' && transaction.sourceId === subscriptionId)
  );
};

export const isLinkedSubscriptionTransaction = (transaction: Transaction, subscription: Subscription) => {
  return Boolean(
    (subscription.transactionId && transaction.id === subscription.transactionId) ||
      transaction.subscriptionId === subscription.id ||
      (transaction.sourceType === 'subscription' && transaction.sourceId === subscription.id),
  );
};

export const hasBillingTransaction = (
  transactions: Transaction[],
  params: { id: string; sourceId: string; sourceType: 'client' | 'subscription'; date: string; clientId?: string; subscriptionId?: string },
) => {
  return transactions.some((transaction) => {
    const sameId = transaction.id === params.id;
    const sameSource = transaction.sourceType === params.sourceType && transaction.sourceId === params.sourceId;
    const sameClient = Boolean(params.clientId && transaction.clientId === params.clientId);
    const sameSubscription = Boolean(params.subscriptionId && transaction.subscriptionId === params.subscriptionId);

    const sameDate = transaction.date.slice(0, 10) === params.date.slice(0, 10);

    return sameId || (sameDate && (sameSource || sameClient || sameSubscription));
  });
};

export const createClientTransaction = (client: Client, date: string, id = `auto-client-onetime-${client.id}`): Transaction => ({
  id,
  amount: client.revenue,
  type: 'INCOME',
  status: 'COMPLETED',
  date,
  notes: client.paymentType === 'retainer' ? `${client.name} retainer` : `${client.name} one-time payment`,
  sourceType: 'client',
  sourceId: client.id,
  clientId: client.id,
  categoryId: 'CLIENT',
  isAuto: true,
});

export const createSubscriptionTransaction = (subscription: Subscription, date: string, id = `auto-sub-${subscription.id}-${date.slice(0, 10)}`): Transaction => ({
  id,
  amount: subscription.amount,
  type: 'EXPENSE',
  status: 'COMPLETED',
  date,
  notes: `Subscription: ${subscription.name}`,
  sourceType: 'subscription',
  sourceId: subscription.id,
  subscriptionId: subscription.id,
  categoryId: 'TOOLS',
  isAuto: true,
});

export const createManualClientTransaction = (client: Client, date: string): Transaction => ({
  ...createClientTransaction(client, date, makeId()),
  isAuto: false,
});

export const syncClientTransactions = (transactions: Transaction[], client: Client) => {
  let updatedLinkedTransaction = false;

  return transactions.flatMap((transaction) => {
    if (!isLinkedClientTransaction(transaction, client)) return [transaction];

    if (updatedLinkedTransaction) return [];
    updatedLinkedTransaction = true;

    const linkedDate = client.paymentType === 'retainer' ? client.nextBillingDate : client.paymentDate;

    return [{
      ...transaction,
      amount: client.revenue,
      date: linkedDate ? toIsoDate(linkedDate) : transaction.date,
      clientId: client.id,
      sourceId: client.id,
      sourceType: 'client' as const,
      notes: transaction.isAuto
        ? client.paymentType === 'retainer'
          ? `${client.name} retainer`
          : `${client.name} one-time payment`
        : transaction.notes,
    }];
  });
};

export const syncSubscriptionTransactions = (transactions: Transaction[], subscription: Subscription) => {
  let updatedLinkedTransaction = false;

  return transactions.flatMap((transaction) => {
    if (!isLinkedSubscriptionTransaction(transaction, subscription)) return [transaction];

    if (updatedLinkedTransaction) return [];
    updatedLinkedTransaction = true;

    return [{
      ...transaction,
      amount: subscription.amount,
      date: toIsoDate(subscription.nextBillingDate),
      subscriptionId: subscription.id,
      sourceId: subscription.id,
      sourceType: 'subscription' as const,
      notes: transaction.isAuto ? `Subscription: ${subscription.name}` : transaction.notes,
    }];
  });
};

export const removeClientTransactions = (transactions: Transaction[], clientId: string) => {
  return transactions.filter((transaction) => !isClientTransaction(transaction, clientId));
};

export const removeSubscriptionTransactions = (transactions: Transaction[], subscriptionId: string) => {
  return transactions.filter((transaction) => !isSubscriptionTransaction(transaction, subscriptionId));
};
