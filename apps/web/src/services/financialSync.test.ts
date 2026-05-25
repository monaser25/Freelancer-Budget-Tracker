import { Client, Subscription, Transaction } from '@/types/finance';
import { reconcileFinancialSnapshot } from './financialSync';

const baseClient = (overrides: Partial<Client> = {}): Client => ({
  id: 'client-1',
  name: 'Acme',
  revenue: 100,
  clientType: 'COMPANY',
  status: 'ACTIVE',
  paymentType: 'retainer',
  nextBillingDate: '2026-06-01',
  createdAt: '2026-05-01T00:00:00.000Z',
  updatedAt: '2026-05-01T00:00:00.000Z',
  ...overrides,
});

const baseSubscription = (overrides: Partial<Subscription> = {}): Subscription => ({
  id: 'sub-1',
  name: 'Tool',
  amount: 25,
  cycle: 'MONTHLY',
  billingCycle: 'MONTHLY',
  billingDay: 1,
  nextBillingDate: '2026-06-01',
  status: 'ACTIVE',
  ...overrides,
});

const baseTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
  id: 'tx-1',
  name: 'May Acme Retainer',
  amount: 100,
  type: 'INCOME',
  status: 'COMPLETED',
  date: '2026-05-01T12:00:00.000Z',
  sourceType: 'client',
  sourceId: 'client-1',
  sourceBillingDate: '2026-05-01T12:00:00.000Z',
  clientId: 'client-1',
  categoryId: 'CLIENT',
  isAuto: true,
  ...overrides,
});

describe('financial snapshot reconciliation', () => {
  it('does not edit historical client transactions when future client settings change', () => {
    const result = reconcileFinancialSnapshot({
      clients: [baseClient({ revenue: 250, nextBillingDate: '2026-06-01' })],
      subscriptions: [],
      transactions: [baseTransaction({ amount: 100 })],
    });

    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0]).toEqual(expect.objectContaining({
      id: 'tx-1',
      amount: 100,
      name: 'May Acme Retainer',
      sourceBillingDate: '2026-05-01T12:00:00.000Z',
    }));
  });

  it('keeps client payment history after the client is archived or absent from active lists', () => {
    const result = reconcileFinancialSnapshot({
      clients: [baseClient({ archivedAt: '2026-05-15T12:00:00.000Z', status: 'INACTIVE' })],
      subscriptions: [],
      transactions: [baseTransaction()],
    });

    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0].clientId).toBe('client-1');
  });

  it('does not edit historical subscription transactions when future subscription settings change', () => {
    const result = reconcileFinancialSnapshot({
      clients: [],
      subscriptions: [baseSubscription({ amount: 75, name: 'Tool Pro' })],
      transactions: [baseTransaction({
        id: 'sub-tx-1',
        name: 'May Tool Payment',
        amount: 25,
        type: 'EXPENSE',
        sourceType: 'subscription',
        sourceId: 'sub-1',
        sourceBillingDate: '2026-05-01T12:00:00.000Z',
        clientId: undefined,
        subscriptionId: 'sub-1',
        categoryId: 'TOOLS',
      })],
    });

    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0]).toEqual(expect.objectContaining({
      id: 'sub-tx-1',
      name: 'May Tool Payment',
      amount: 25,
      sourceBillingDate: '2026-05-01T12:00:00.000Z',
    }));
  });

  it('dedupes generated transactions for the same source billing date only', () => {
    const result = reconcileFinancialSnapshot({
      clients: [baseClient()],
      subscriptions: [],
      transactions: [
        baseTransaction({ id: 'tx-keep' }),
        baseTransaction({ id: 'tx-drop', amount: 999 }),
        baseTransaction({ id: 'tx-next', amount: 125, sourceBillingDate: '2026-06-01T12:00:00.000Z', date: '2026-06-01T12:00:00.000Z' }),
      ],
    });

    expect(result.transactions.map((tx) => tx.id).sort()).toEqual(['tx-keep', 'tx-next']);
  });
});
