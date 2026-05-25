import { NextResponse } from 'next/server';
import { authenticateRequest, getUserId } from '@/server/auth';
import { ensureUser } from '@/server/devUser';
import { withApiError } from '@/server/errors';
import { reconcileSubscriptionLinkedTransaction, toDate } from '@/server/linked-transactions';
import { prisma } from '@/server/prisma';
import { SubscriptionSchema } from '@/server/validation';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = async (request: Request) => withApiError(request, async () => {
  const user = await authenticateRequest(request);
  const userId = getUserId(user);
  const validated = SubscriptionSchema.parse(await request.json());

  await ensureUser(user);

  const subscription = await prisma.$transaction(async (tx) => {
    const newSub = await tx.subscription.create({
      data: {
        ...validated,
        nextBillingDate: toDate(validated.nextBillingDate) || new Date(),
        userId,
      },
    });

    await reconcileSubscriptionLinkedTransaction(tx, userId, newSub);
    return tx.subscription.findUniqueOrThrow({ where: { id: newSub.id } });
  });

  return NextResponse.json(subscription, { status: 201 });
});
