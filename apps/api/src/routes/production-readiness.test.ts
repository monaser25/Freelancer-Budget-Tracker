import http from 'http';
import { AddressInfo } from 'net';

jest.mock('../db', () => ({
  prisma: {
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
  },
}));

import { app } from '../server';
import { prisma } from '../db';

const mockPrisma = prisma as any;

const tokenFor = (id: string) => `flowledger-dev:${encodeURIComponent(JSON.stringify({ id, email: `${id}@example.com` }))}`;

const request = async (
  method: string,
  path: string,
  userId = 'user-a',
  body?: unknown,
): Promise<{ status: number; body: any }> => {
  const server = app.listen(0);
  const port = (server.address() as AddressInfo).port;

  try {
    return await new Promise((resolve, reject) => {
      const payload = body === undefined ? undefined : JSON.stringify(body);
      const req = http.request({
        hostname: '127.0.0.1',
        port,
        path,
        method,
        headers: {
          Authorization: `Bearer ${tokenFor(userId)}`,
          ...(payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {}),
        },
      }, (res) => {
        let raw = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => { raw += chunk; });
        res.on('end', () => {
          resolve({
            status: res.statusCode || 0,
            body: raw ? JSON.parse(raw) : null,
          });
        });
      });

      req.on('error', reject);
      if (payload) req.write(payload);
      req.end();
    });
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
};

describe('production readiness route safeguards', () => {
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

    const response = await request('GET', '/api/clients');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([{ id: 'client-a', userId: 'user-a' }]);
    expect(mockPrisma.client.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId: 'user-a' },
    }));
  });

  it('prevents updating another user client', async () => {
    mockPrisma.client.findFirst.mockResolvedValue(null);

    const response = await request('PUT', '/api/clients/update/client-b', 'user-a', { name: 'Updated' });

    expect(response.status).toBe(404);
    expect(mockPrisma.client.findFirst).toHaveBeenCalledWith({ where: { id: 'client-b', userId: 'user-a' } });
    expect(mockPrisma.client.update).not.toHaveBeenCalled();
  });

  it('prevents deleting another user client', async () => {
    mockPrisma.client.deleteMany.mockResolvedValue({ count: 0 });
    mockPrisma.transaction.deleteMany.mockResolvedValue({ count: 0 });

    const response = await request('DELETE', '/api/clients/delete/client-b');

    expect(response.status).toBe(404);
    expect(mockPrisma.client.deleteMany).toHaveBeenCalledWith({ where: { id: 'client-b', userId: 'user-a' } });
  });

  it('prevents linked transactions from being edited directly', async () => {
    mockPrisma.transaction.findFirst.mockResolvedValue({ id: 'tx-1', userId: 'user-a', sourceType: 'client' });

    const response = await request('PUT', '/api/transactions/update/tx-1', 'user-a', { amount: 20 });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Linked transactions cannot be edited directly');
    expect(mockPrisma.transaction.updateMany).not.toHaveBeenCalled();
  });

  it('prevents linked transactions from being deleted directly', async () => {
    mockPrisma.transaction.findFirst.mockResolvedValue({ id: 'tx-1', userId: 'user-a', sourceType: 'subscription' });

    const response = await request('DELETE', '/api/transactions/delete/tx-1');

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Linked transactions cannot be deleted directly');
    expect(mockPrisma.transaction.deleteMany).not.toHaveBeenCalledWith({ where: { id: 'tx-1', userId: 'user-a' } });
  });

  it('deletes linked client transactions before deleting a client', async () => {
    mockPrisma.transaction.deleteMany.mockResolvedValue({ count: 1 });
    mockPrisma.client.deleteMany.mockResolvedValue({ count: 1 });

    const response = await request('DELETE', '/api/clients/delete/client-a');

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

    const response = await request('DELETE', '/api/subscriptions/delete/sub-a');

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
