import { NextResponse } from 'next/server';
import { authenticateRequest, getUserId } from '@/server/auth';
import { ensureUser } from '@/server/devUser';
import { withApiError } from '@/server/errors';
import { toDate } from '@/server/linked-transactions';
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

    if (newSub.status === 'ACTIVE') {
      const transactionId = newSub.transactionId || `auto-sub-${newSub.id}-${newSub.nextBillingDate.toISOString().slice(0, 10)}`;
      const newTx = await tx.transaction.create({
        data: {
          id: transactionId,
          userId,
          amount: newSub.amount,
          type: 'EXPENSE',
          status: 'COMPLETED',
          date: newSub.nextBillingDate,
          notes: `Subscription: ${newSub.name}`,
          sourceType: 'subscription',
          sourceId: newSub.id,
          subscriptionId: newSub.id,
          categoryId: 'TOOLS',
          isAuto: true,
        },
      });

      if (!newSub.transactionId) {
        await tx.subscription.update({
          where: { id: newSub.id },
          data: { transactionId: newTx.id },
        });
        newSub.transactionId = newTx.id;
      }
    }

    return newSub;
  });

  return NextResponse.json(subscription, { status: 201 });
});
