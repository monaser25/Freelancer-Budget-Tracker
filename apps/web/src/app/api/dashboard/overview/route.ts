import { NextResponse } from 'next/server';
import { authenticateRequest, getUserId } from '@/server/auth';
import { prisma } from '@/server/prisma';
import { withApiError } from '@/server/errors';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = async (request: Request) => withApiError(request, async () => {
  const user = await authenticateRequest(request);
  const userId = getUserId(user);

  const [clients, subscriptions, transactions] = await Promise.all([
    prisma.client.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
    prisma.subscription.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
    prisma.transaction.findMany({
      where: { userId, deletedAt: null },
      orderBy: { date: 'desc' },
    }),
  ]);

  return NextResponse.json({ clients, subscriptions, transactions });
});
