import { Client, Subscription, Transaction } from '@/types/finance';
import { reconcileFinancialSnapshot } from './financialSync';

const baseClient = (overrides: Partial<Client> = {}): Client => ({
  id: 'client-1',
  name: 'Acme',
  revenue: 100,
  clientType: 'COMPANY',
  status: 'ACTIVE',
  paymentType: 'onetime',
  paymentDate: '2026-05-01',
  createdAt: '2026-05-01T00:00:00.000Z',
  updatedAt: '2026-05-01T00:00:00.000Z',
  ...overrides,
});

const baseSubscription = (overrides: Partial<Subscription> = {}): Subscription => ({
  id: 'sub-1',
  name: 'Tool',
  amount: 25,
  cycle: 'MONTHLY',
  billingDay: 1,
  nextBillingDate: '2026-05-01',
  status: 'ACTIVE',
  ...overrides,
});

const baseTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
  id: 'tx-1',
  amount: 100,
  type: 'INCOME',
  status: 'COMPLETED',
  date: '2026-05-01T12:00:00.000Z',
  notes: 'Acme one-time payment',
  sourceType: 'client',
  sourceId: 'client-1',
  clientId: 'client-1',
  categoryId: 'CLIENT',
  isAuto: true,
  ...overrides,
});

describe('financial snapshot reconciliation', () => {
  it('updates a client linked transaction from the client source of truth', () => {
    const result = reconcileFinancialSnapshot({
      clients: [baseClient({ revenue: 250, transactionId: 'tx-1' })],
      subscriptions: [],
      transactions: [baseTransaction({ amount: 100 })],
    });

    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0]).toEqual(expect.objectContaining({
      id: 'tx-1',
      amount: 250,
      sourceType: 'client',
      sourceId: 'client-1',
      clientId: 'client-1',
      categoryId: 'CLIENT',
      isAuto: true,
    }));
  });

  it('removes a client linked transaction when the client is deleted', () => {
    const result = reconcileFinancialSnapshot({
      clients: [],
      subscriptions: [],
      transactions: [baseTransaction()],
    });

    expect(result.transactions).toEqual([]);
  });

  it('updates a subscription linked transaction from the subscription source of truth', () => {
    const result = reconcileFinancialSnapshot({
      clients: [],
      subscriptions: [baseSubscription({ amount: 75, name: 'Tool Pro', transactionId: 'sub-tx-1' })],
      transactions: [baseTransaction({
        id: 'sub-tx-1',
        amount: 25,
        type: 'EXPENSE',
        notes: 'Subscription: Tool',
        sourceType: 'subscription',
        sourceId: 'sub-1',
        clientId: undefined,
        subscriptionId: 'sub-1',
        categoryId: 'TOOLS',
      })],
    });

    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0]).toEqual(expect.objectContaining({
      id: 'sub-tx-1',
      amount: 75,
      type: 'EXPENSE',
      notes: 'Subscription: Tool Pro',
      sourceType: 'subscription',
      sourceId: 'sub-1',
      subscriptionId: 'sub-1',
      categoryId: 'TOOLS',
      isAuto: true,
    }));
  });

  it('removes a subscription linked transaction when the subscription is deleted', () => {
    const result = reconcileFinancialSnapshot({
      clients: [],
      subscriptions: [],
      transactions: [baseTransaction({
        id: 'sub-tx-1',
        type: 'EXPENSE',
        sourceType: 'subscription',
        sourceId: 'sub-1',
        clientId: undefined,
        subscriptionId: 'sub-1',
        categoryId: 'TOOLS',
      })],
    });

    expect(result.transactions).toEqual([]);
  });

  it('keeps one linked transaction per source and reconciles stale duplicates', () => {
    const result = reconcileFinancialSnapshot({
      clients: [baseClient({ revenue: 400, paymentDate: '2026-05-02', transactionId: 'tx-keep' })],
      subscriptions: [],
      transactions: [
        baseTransaction({ id: 'tx-drop', amount: 100, date: '2026-04-01T12:00:00.000Z' }),
        baseTransaction({ id: 'tx-keep', amount: 150, date: '2026-04-15T12:00:00.000Z', notes: 'stale note', isAuto: false }),
      ],
    });

    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0]).toEqual(expect.objectContaining({
      id: 'tx-keep',
      amount: 400,
      date: expect.stringContaining('2026-05-02'),
      notes: 'Acme one-time payment',
      isAuto: true,
    }));
  });
});
