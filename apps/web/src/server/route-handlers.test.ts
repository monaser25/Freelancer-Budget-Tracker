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
import { POST as createTransaction } from '@/app/api/transactions/create/route';

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
    mockPrisma.client.findFirst.mockResolvedValue(null);

    const response = await deleteClient(
      request('DELETE', '/api/clients/delete/client-b'),
      { params: { id: 'client-b' } },
    );

    expect(response.status).toBe(404);
    expect(mockPrisma.client.update).not.toHaveBeenCalled();
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

  it('archives clients without deleting historical transactions', async () => {
    mockPrisma.client.findFirst.mockResolvedValue({ id: 'client-a', userId: 'user-a' });
    mockPrisma.client.update.mockResolvedValue({ id: 'client-a', userId: 'user-a', status: 'INACTIVE', archivedAt: new Date() });

    const response = await deleteClient(
      request('DELETE', '/api/clients/delete/client-a'),
      { params: { id: 'client-a' } },
    );

    expect(response.status).toBe(200);
    expect(mockPrisma.transaction.deleteMany).not.toHaveBeenCalled();
    expect(mockPrisma.client.update).toHaveBeenCalledWith({
      where: { id: 'client-a' },
      data: expect.objectContaining({ status: 'INACTIVE', archivedAt: expect.any(Date) }),
    });
  });

  it('archives subscriptions without deleting historical transactions', async () => {
    mockPrisma.subscription.findFirst.mockResolvedValue({ id: 'sub-a', userId: 'user-a' });
    mockPrisma.subscription.update.mockResolvedValue({ id: 'sub-a', userId: 'user-a', status: 'INACTIVE', archivedAt: new Date() });

    const response = await deleteSubscription(
      request('DELETE', '/api/subscriptions/delete/sub-a'),
      { params: { id: 'sub-a' } },
    );

    expect(response.status).toBe(200);
    expect(mockPrisma.transaction.deleteMany).not.toHaveBeenCalled();
    expect(mockPrisma.subscription.update).toHaveBeenCalledWith({
      where: { id: 'sub-a' },
      data: expect.objectContaining({ status: 'INACTIVE', archivedAt: expect.any(Date) }),
    });
  });

  it('creates manual transactions with a required name', async () => {
    mockPrisma.transaction.create.mockResolvedValue({ id: 'tx-manual', name: 'Manual income', sourceType: 'manual' });

    const response = await createTransaction(request('POST', '/api/transactions/create', 'user-a', {
      name: 'Manual income',
      amount: 100,
      type: 'INCOME',
      status: 'COMPLETED',
      date: '2026-05-01',
      sourceType: 'manual',
      categoryId: 'CLIENT',
    }));

    expect(response.status).toBe(201);
    expect(mockPrisma.transaction.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ name: 'Manual income', userId: 'user-a' }),
    }));
  });

  it('returns 400 when manual transaction name is missing', async () => {
    const response = await createTransaction(request('POST', '/api/transactions/create', 'user-a', {
      amount: 100,
      type: 'INCOME',
      status: 'COMPLETED',
      date: '2026-05-01',
      sourceType: 'manual',
      categoryId: 'CLIENT',
    }));

    expect(response.status).toBe(400);
    expect(mockPrisma.transaction.create).not.toHaveBeenCalled();
  });

  it('updates client billing settings without touching historical transactions', async () => {
    mockPrisma.client.findFirst.mockResolvedValue({ id: 'client-a', userId: 'user-a' });
    mockPrisma.client.update.mockResolvedValue({ id: 'client-a', name: 'Updated', revenue: 200, userId: 'user-a' });

    const response = await updateClient(
      request('PUT', '/api/clients/update/client-a', 'user-a', {
        name: 'Updated',
        revenue: 200,
        nextBillingDate: '2026-06-01',
        paymentType: 'retainer',
        clientType: 'INDIVIDUAL',
        status: 'ACTIVE',
      }),
      { params: { id: 'client-a' } },
    );

    expect(response.status).toBe(200);
    expect(mockPrisma.transaction.update).not.toHaveBeenCalled();
    expect(mockPrisma.transaction.deleteMany).not.toHaveBeenCalled();
  });

  it('returns 400 validation errors for invalid client update payloads', async () => {
    const response = await updateClient(
      request('PUT', '/api/clients/update/client-a', 'user-a', { nextBillingDate: 'not-a-date' }),
      { params: { id: 'client-a' } },
    );

    expect(response.status).toBe(400);
    expect(mockPrisma.client.update).not.toHaveBeenCalled();
  });
});
