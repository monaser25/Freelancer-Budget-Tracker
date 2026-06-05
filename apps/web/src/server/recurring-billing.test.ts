import { recordClientPayment, recordSubscriptionPayment, runDueRecurringPaymentsInTransaction } from './recurring-billing';

type MockRow = Record<string, any>;
type MockWhere = Record<string, any>;

const makeTx = () => {
  const clients: MockRow[] = [];
  const subscriptions: MockRow[] = [];
  const transactions: MockRow[] = [];

  const matchesWhere = (item: MockRow, where: MockWhere): boolean => Object.entries(where).every(([key, value]) => {
    if (key === 'OR') return (value as MockWhere[]).some((clause) => matchesWhere(item, clause));
    if (value && typeof value === 'object' && 'lte' in value) return item[key] <= (value as { lte: any }).lte;
    return item[key] === value;
  });

  return {
    clients,
    subscriptions,
    transactions,
    tx: {
      client: {
        findFirst: jest.fn(({ where }) => Promise.resolve(clients.find((item) => matchesWhere(item, where)) || null)),
        findMany: jest.fn(({ where }) => Promise.resolve(clients.filter((item) => matchesWhere(item, where)))),
        update: jest.fn(({ where, data }) => {
          const item = clients.find((client) => client.id === where.id);
          Object.assign(item!, data);
          return Promise.resolve(item!);
        }),
      },
      subscription: {
        findFirst: jest.fn(({ where }) => Promise.resolve(subscriptions.find((item) => matchesWhere(item, where)) || null)),
        findMany: jest.fn(({ where }) => Promise.resolve(subscriptions.filter((item) => matchesWhere(item, where)))),
        update: jest.fn(({ where, data }) => {
          const item = subscriptions.find((subscription) => subscription.id === where.id);
          Object.assign(item!, data);
          return Promise.resolve(item!);
        }),
      },
      transaction: {
        findFirst: jest.fn(({ where }) => Promise.resolve(transactions.find((item) => matchesWhere(item, where)) || null)),
        findFirstOrThrow: jest.fn(({ where }) => {
          const item = transactions.find((transaction) => matchesWhere(transaction, where));
          if (!item) throw new Error('not found');
          return Promise.resolve(item);
        }),
        create: jest.fn(({ data }) => {
          transactions.push(data);
          return Promise.resolve(data);
        }),
      },
    } as any,
  };
};

describe('recurring billing', () => {
  it('records a client retainer payment and advances one month', async () => {
    const state = makeTx();
    state.clients.push({ id: 'client-1', userId: 'user-a', name: 'Acme', revenue: 100, status: 'ACTIVE', paymentType: 'retainer', nextBillingDate: new Date('2026-05-01T12:00:00.000Z'), archivedAt: null });

    const result = await recordClientPayment(state.tx, 'user-a', 'client-1', new Date('2026-05-25T12:00:00.000Z'));

    expect(result.transaction).toEqual(expect.objectContaining({
      name: 'Acme retainer payment',
      amount: 100,
      type: 'INCOME',
      sourceType: 'client',
      sourceId: 'client-1',
      clientId: 'client-1',
    }));
    expect(result.transaction.sourceBillingDate!.toISOString().slice(0, 10)).toBe('2026-05-01');
    expect(result.client.nextBillingDate!.toISOString().slice(0, 10)).toBe('2026-06-01');
  });

  it('records a subscription payment and advances by billing cycle', async () => {
    const state = makeTx();
    state.subscriptions.push({ id: 'sub-1', userId: 'user-a', name: 'Tool', amount: 30, status: 'ACTIVE', cycle: 'QUARTERLY', billingCycle: 'QUARTERLY', nextBillingDate: new Date('2026-05-01T12:00:00.000Z'), archivedAt: null });

    const result = await recordSubscriptionPayment(state.tx, 'user-a', 'sub-1', new Date('2026-05-25T12:00:00.000Z'));

    expect(result.transaction).toEqual(expect.objectContaining({
      name: 'Tool subscription payment',
      amount: 30,
      type: 'EXPENSE',
      sourceType: 'subscription',
      sourceId: 'sub-1',
      subscriptionId: 'sub-1',
    }));
    expect(result.subscription.nextBillingDate.toISOString().slice(0, 10)).toBe('2026-08-01');
  });

  it('runDueRecurringPayments is idempotent for existing source billing dates', async () => {
    const state = makeTx();
    const dueDate = new Date('2026-05-01T12:00:00.000Z');
    state.clients.push({ id: 'client-1', userId: 'user-a', name: 'Acme', revenue: 100, status: 'ACTIVE', paymentType: 'retainer', nextBillingDate: dueDate, archivedAt: null });

    await runDueRecurringPaymentsInTransaction(state.tx, 'user-a', new Date('2026-05-25T12:00:00.000Z'));
    await runDueRecurringPaymentsInTransaction(state.tx, 'user-a', new Date('2026-05-25T12:00:00.000Z'));

    expect(state.transactions).toHaveLength(1);
    expect(state.transactions[0].sourceBillingDate.toISOString().slice(0, 10)).toBe('2026-05-01');
    expect(state.clients[0].nextBillingDate.toISOString().slice(0, 10)).toBe('2026-06-01');
  });

  it('skips removed (archived) clients when running due recurring payments', async () => {
    const state = makeTx();
    const dueDate = new Date('2026-05-01T12:00:00.000Z');
    state.clients.push({
      id: 'client-removed',
      userId: 'user-a',
      name: 'Old Acme',
      revenue: 100,
      status: 'ACTIVE',
      paymentType: 'retainer',
      nextBillingDate: dueDate,
      archivedAt: new Date('2026-04-15T12:00:00.000Z'),
    });

    await runDueRecurringPaymentsInTransaction(state.tx, 'user-a', new Date('2026-05-25T12:00:00.000Z'));

    expect(state.transactions).toHaveLength(0);
    expect(state.clients[0].nextBillingDate.toISOString().slice(0, 10)).toBe('2026-05-01');
  });

  it('skips removed (archived) subscriptions when running due recurring payments', async () => {
    const state = makeTx();
    const dueDate = new Date('2026-05-01T12:00:00.000Z');
    state.subscriptions.push({
      id: 'sub-removed',
      userId: 'user-a',
      name: 'Legacy Tool',
      amount: 25,
      status: 'ACTIVE',
      cycle: 'MONTHLY',
      billingCycle: 'MONTHLY',
      nextBillingDate: dueDate,
      archivedAt: new Date('2026-04-20T12:00:00.000Z'),
    });

    await runDueRecurringPaymentsInTransaction(state.tx, 'user-a', new Date('2026-05-25T12:00:00.000Z'));

    expect(state.transactions).toHaveLength(0);
    expect(state.subscriptions[0].nextBillingDate.toISOString().slice(0, 10)).toBe('2026-05-01');
  });
});
