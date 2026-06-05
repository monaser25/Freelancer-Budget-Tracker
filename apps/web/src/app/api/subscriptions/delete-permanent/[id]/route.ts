import { NextResponse } from 'next/server';
import { authenticateRequest, getUserId } from '@/server/auth';
import { HttpError, withApiError } from '@/server/errors';
import { prisma } from '@/server/prisma';
import { subscriptionLinkedTransactionWhere } from '@/server/linked-transactions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = { params: { id: string } };

// Permanently delete a subscription and every transaction linked to it, in one
// atomic transaction. Mirrors the client permanent-delete route.
export const DELETE = async (request: Request, { params }: RouteContext) => withApiError(request, async () => {
  const user = await authenticateRequest(request);
  const userId = getUserId(user);

  await prisma.$transaction(async (tx) => {
    const existing = await tx.subscription.findFirst({ where: { id: params.id, userId } });
    if (!existing) throw new HttpError(404, 'Subscription not found');

    await tx.transaction.deleteMany({ where: subscriptionLinkedTransactionWhere(userId, params.id) });
    await tx.subscription.delete({ where: { id: params.id } });
  });

  return NextResponse.json({ id: params.id });
});
