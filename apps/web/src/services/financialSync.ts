import { Client, Subscription, Transaction } from '@/types/finance';

const makeId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const normalizeSourceType = (sourceType: Transaction['sourceType'] | 'client-payment') => {
  return sourceType === 'client-payment' ? 'client' : sourceType;
};

const toIsoDate = (date: string) => new Date(`${date.slice(0, 10)}T12:00:00`).toISOString();

const todayKey = () => new Date().toISOString().slice(0, 10);

const computeNextBillingDate = (billingDay?: number, from = new Date()) => {
  const safeDay = Math.max(1, Math.min(28, billingDay || 1));
  const candidate = new Date(from.getFullYear(), from.getMonth(), safeDay, 12);
  const today = new Date(from.getFullYear(), from.getMonth(), from.getDate(), 12);

  if (candidate >= today) return candidate.toISOString().slice(0, 10);
  return new Date(from.getFullYear(), from.getMonth() + 1, safeDay, 12).toISOString().slice(0, 10);
};

const getClientTransactionDate = (client: Client) => {
  if (client.paymentType === 'retainer') return client.nextBillingDate || computeNextBillingDate(client.billingDay);
  return client.paymentDate || todayKey();
};

const shouldHaveClientTransaction = (client: Client) => client.status !== 'PROSPECT' && client.status !== 'INACTIVE';

export const getLinkedTransactionKey = (transaction: Transaction) => {
  const sourceType = normalizeSourceType(transaction.sourceType as Transaction['sourceType'] | 'client-payment');

  if (sourceType === 'client') {
    const clientId = transaction.clientId || transaction.sourceId;
    return clientId ? `client:${clientId}` : null;
  }

  if (sourceType === 'subscription') {
    const subscriptionId = transaction.subscriptionId || transaction.sourceId;
    return subscriptionId ? `subscription:${subscriptionId}` : null;
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

export const createClientTransaction = (client: Client, date: string, id?: string): Transaction => ({
  id: id || (client.paymentType === 'retainer' ? `auto-client-retainer-${client.id}` : `auto-client-onetime-${client.id}`),
  amount: client.revenue,
  type: 'INCOME',
  status: client.paymentType === 'onetime' && date.slice(0, 10) <= todayKey() ? 'COMPLETED' : 'PENDING',
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

    const linkedDate = getClientTransactionDate(client);

    return [{
      ...transaction,
      amount: client.revenue,
      type: 'INCOME' as const,
      status: client.paymentType === 'onetime' && linkedDate <= todayKey() ? 'COMPLETED' as const : 'PENDING' as const,
      date: toIsoDate(linkedDate),
      clientId: client.id,
      sourceId: client.id,
      sourceType: 'client' as const,
      categoryId: 'CLIENT',
      isAuto: true,
      notes: client.paymentType === 'retainer'
        ? `${client.name} retainer`
        : `${client.name} one-time payment`,
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
      type: 'EXPENSE' as const,
      status: 'COMPLETED' as const,
      date: toIsoDate(subscription.nextBillingDate),
      subscriptionId: subscription.id,
      sourceId: subscription.id,
      sourceType: 'subscription' as const,
      categoryId: 'TOOLS',
      isAuto: true,
      notes: `Subscription: ${subscription.name}`,
    }];
  });
};

export const removeClientTransactions = (transactions: Transaction[], clientId: string) => {
  return transactions.filter((transaction) => !isClientTransaction(transaction, clientId));
};

export const removeSubscriptionTransactions = (transactions: Transaction[], subscriptionId: string) => {
  return transactions.filter((transaction) => !isSubscriptionTransaction(transaction, subscriptionId));
};

const normalizeManualTransaction = (transaction: Transaction): Transaction => ({
  ...transaction,
  sourceType: 'manual',
  sourceId: undefined,
  clientId: undefined,
  subscriptionId: undefined,
  isAuto: false,
});

const normalizeLinkedTransaction = (transaction: Transaction): Transaction => {
  const sourceType = normalizeSourceType(transaction.sourceType as Transaction['sourceType'] | 'client-payment');

  if (sourceType === 'client') {
    const clientId = transaction.clientId || transaction.sourceId;
    return clientId ? { ...transaction, sourceType: 'client', sourceId: clientId, clientId } : normalizeManualTransaction(transaction);
  }

  if (sourceType === 'subscription') {
    const subscriptionId = transaction.subscriptionId || transaction.sourceId;
    return subscriptionId ? { ...transaction, sourceType: 'subscription', sourceId: subscriptionId, subscriptionId } : normalizeManualTransaction(transaction);
  }

  return normalizeManualTransaction(transaction);
};

const pickLinkedTransaction = (transactions: Transaction[], preferredId?: string) => (
  (preferredId ? transactions.find((transaction) => transaction.id === preferredId) : undefined) || transactions[0]
);

export const reconcileFinancialSnapshot = (data: { clients: Client[]; subscriptions: Subscription[]; transactions: Transaction[] }) => {
  const clients = data.clients.map((client) => ({ ...client }));
  const subscriptions = data.subscriptions.map((subscription) => ({ ...subscription }));
  const normalizedTransactions = data.transactions.map(normalizeLinkedTransaction);
  const linkedTransactions = normalizedTransactions.filter((transaction) => getLinkedTransactionKey(transaction));
  const transactions = normalizedTransactions.filter((transaction) => !getLinkedTransactionKey(transaction));

  clients.forEach((client) => {
    const matches = linkedTransactions.filter((transaction) => isLinkedClientTransaction(transaction, client));

    if (!shouldHaveClientTransaction(client)) {
      client.transactionId = undefined;
      return;
    }

    const date = toIsoDate(getClientTransactionDate(client));
    const primary = pickLinkedTransaction(matches, client.transactionId);
    const linked = primary
      ? syncClientTransactions([primary], client)[0]
      : createClientTransaction(client, date);

    client.transactionId = linked.id;
    transactions.push(linked);
  });

  subscriptions.forEach((subscription) => {
    const matches = linkedTransactions.filter((transaction) => isLinkedSubscriptionTransaction(transaction, subscription));

    if (subscription.status !== 'ACTIVE') {
      subscription.transactionId = undefined;
      return;
    }

    const date = toIsoDate(subscription.nextBillingDate);
    const primary = pickLinkedTransaction(matches, subscription.transactionId);
    const linked = primary
      ? syncSubscriptionTransactions([primary], subscription)[0]
      : createSubscriptionTransaction(subscription, date);

    subscription.transactionId = linked.id;
    transactions.push(linked);
  });

  return {
    clients,
    subscriptions,
    transactions: dedupeLinkedTransactions(transactions),
  };
};
