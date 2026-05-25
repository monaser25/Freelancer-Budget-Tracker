import { getClientRevenue } from './financialSelectors';
import { Transaction } from '@/types/finance';

const transaction = (overrides: Partial<Transaction>): Transaction => ({
  id: 'tx-1',
  name: 'Client payment',
  amount: 100,
  type: 'INCOME',
  status: 'COMPLETED',
  date: '2026-05-01T12:00:00.000Z',
  sourceType: 'client',
  sourceId: 'client-1',
  sourceBillingDate: '2026-05-01T12:00:00.000Z',
  categoryId: 'CLIENT',
  ...overrides,
});

describe('financial selectors', () => {
  it('calculates client payment history from clientId and source links', () => {
    expect(getClientRevenue([
      transaction({ id: 'tx-client-id', clientId: 'client-1', amount: 100 }),
      transaction({ id: 'tx-source-id', clientId: undefined, sourceId: 'client-1', amount: 200 }),
      transaction({ id: 'tx-other', clientId: 'client-2', sourceId: 'client-2', amount: 999 }),
    ], 'client-1')).toBe(300);
  });
});
