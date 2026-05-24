const mockPrisma = {
  $queryRaw: jest.fn(),
  $transaction: jest.fn((callback: any) => callback(mockPrisma)),
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  client: {
    findMany: jest.fn(),
    create: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    deleteMany: jest.fn(),
  },
  subscription: {
    findMany: jest.fn(),
    create: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    deleteMany: jest.fn(),
  },
  transaction: {
    findMany: jest.fn(),
    create: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
  },
};

jest.mock('@/server/prisma', () => ({ prisma: mockPrisma }));

import { GET as getClients } from '@/app/api/clients/route';
import { DELETE as deleteClient } from '@/app/api/clients/delete/[id]/route';
import { DELETE as deleteSubscription } from '@/app/api/subscriptions/delete/[id]/route';
import { DELETE as deleteTransaction } from '@/app/api/transactions/delete/[id]/route';
import { PUT as updateClient } from '@/app/api/clients/update/[id]/route';
import { PUT as updateTransaction } from '@/app/api/transactions/update/[id]/route';

const tokenFor = (id: string) => `flowledger-dev:${encodeURIComponent(JSON.stringify({ id, email: `${id}@example.com` }))}`;

const request = (method: string, path: string, userId = 'user-a', body?: unknown) => new Request(`http://localhost${path}`, {
  method,
  headers: {
    Authorization: `Bearer ${tokenFor(userId)}`,
    ...(body ? { 'Content-Type': 'application/json' } : {}),
  },
  body: body === undefined ? undefined : JSON.stringify(body),
});

describe('Next route handler safeguards', () => {
  beforeEach(() => {
    process.env.ENABLE_DEV_AUTH = 'true';
    jest.clearAllMocks();
    mockPrisma.$transaction.mockImplementation((callback: any) => callback(mockPrisma));
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-a', email: 'user-a@example.com' });
  });

  it('only reads data scoped to the authenticated user', async () => {
    mockPrisma.client.findMany.mockImplementation(({ where }: any) => Promise.resolve(
      where.userId === 'user-a' ? [{ id: 'client-a', userId: 'user-a' }] : [{ id: 'client-b', userId: 'user-b' }],
    ));

    const response = await getClients(request('GET', '/api/clients'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual([{ id: 'client-a', userId: 'user-a' }]);
    expect(mockPrisma.client.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId: 'user-a' },
    }));
  });

  it('prevents updating another user client', async () => {
    mockPrisma.client.findFirst.mockResolvedValue(null);

    const response = await updateClient(
      request('PUT', '/api/clients/update/client-b', 'user-a', { name: 'Updated' }),
      { params: { id: 'client-b' } },
    );

    expect(response.status).toBe(404);
    expect(mockPrisma.client.findFirst).toHaveBeenCalledWith({ where: { id: 'client-b', userId: 'user-a' } });
    expect(mockPrisma.client.update).not.toHaveBeenCalled();
  });

  it('prevents deleting another user client', async () => {
    mockPrisma.client.deleteMany.mockResolvedValue({ count: 0 });
    mockPrisma.transaction.deleteMany.mockResolvedValue({ count: 0 });

    const response = await deleteClient(
      request('DELETE', '/api/clients/delete/client-b'),
      { params: { id: 'client-b' } },
    );

    expect(response.status).toBe(404);
    expect(mockPrisma.client.deleteMany).toHaveBeenCalledWith({ where: { id: 'client-b', userId: 'user-a' } });
  });

  it('prevents linked transactions from being edited directly', async () => {
    mockPrisma.transaction.findFirst.mockResolvedValue({ id: 'tx-1', userId: 'user-a', sourceType: 'client' });

    const response = await updateTransaction(
      request('PUT', '/api/transactions/update/tx-1', 'user-a', { amount: 20 }),
      { params: { id: 'tx-1' } },
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Linked transactions cannot be edited directly');
    expect(mockPrisma.transaction.updateMany).not.toHaveBeenCalled();
  });

  it('prevents linked transactions from being deleted directly', async () => {
    mockPrisma.transaction.findFirst.mockResolvedValue({ id: 'tx-1', userId: 'user-a', sourceType: 'subscription' });

    const response = await deleteTransaction(
      request('DELETE', '/api/transactions/delete/tx-1'),
      { params: { id: 'tx-1' } },
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Linked transactions cannot be deleted directly');
    expect(mockPrisma.transaction.deleteMany).not.toHaveBeenCalledWith({ where: { id: 'tx-1', userId: 'user-a' } });
  });

  it('deletes linked client transactions before deleting a client', async () => {
    mockPrisma.transaction.deleteMany.mockResolvedValue({ count: 1 });
    mockPrisma.client.deleteMany.mockResolvedValue({ count: 1 });

    const response = await deleteClient(
      request('DELETE', '/api/clients/delete/client-a'),
      { params: { id: 'client-a' } },
    );

    expect(response.status).toBe(200);
    expect(mockPrisma.transaction.deleteMany).toHaveBeenCalledWith({
      where: {
        userId: 'user-a',
        OR: [
          { clientId: 'client-a' },
          { sourceType: 'client', sourceId: 'client-a' },
          { sourceType: 'client-payment', sourceId: 'client-a' },
        ],
      },
    });
  });

  it('deletes linked subscription transactions before deleting a subscription', async () => {
    mockPrisma.transaction.deleteMany.mockResolvedValue({ count: 1 });
    mockPrisma.subscription.deleteMany.mockResolvedValue({ count: 1 });

    const response = await deleteSubscription(
      request('DELETE', '/api/subscriptions/delete/sub-a'),
      { params: { id: 'sub-a' } },
    );

    expect(response.status).toBe(200);
    expect(mockPrisma.transaction.deleteMany).toHaveBeenCalledWith({
      where: {
        userId: 'user-a',
        OR: [
          { subscriptionId: 'sub-a' },
          { sourceType: 'subscription', sourceId: 'sub-a' },
        ],
      },
    });
  });
});
