import { NextResponse } from 'next/server';
import { authenticateRequest, getUserId } from '@/server/auth';
import { HttpError, withApiError } from '@/server/errors';
import { reconcileSubscriptionLinkedTransaction, toDate } from '@/server/linked-transactions';
import { prisma } from '@/server/prisma';
import { SubscriptionSchema } from '@/server/validation';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: { id: string } };

export const PUT = async (request: Request, { params }: RouteContext) => withApiError(request, async () => {
  const user = await authenticateRequest(request);
  const userId = getUserId(user);
  const validated = SubscriptionSchema.partial().parse(await request.json());

  const dataToUpdate = {
    ...validated,
    nextBillingDate: validated.nextBillingDate !== undefined ? toDate(validated.nextBillingDate) : undefined,
  };

  const subscription = await prisma.$transaction(async (tx) => {
    const existingSub = await tx.subscription.findFirst({ where: { id: params.id, userId } });
    if (!existingSub) throw new HttpError(404, 'Subscription not found');

    const updatedSub = await tx.subscription.update({
      where: { id: params.id },
      data: dataToUpdate,
    });

    await reconcileSubscriptionLinkedTransaction(tx, userId, updatedSub);
    return tx.subscription.findUniqueOrThrow({ where: { id: updatedSub.id } });
  });

  return NextResponse.json(subscription);
});
