import { NextResponse } from 'next/server';
import { authenticateRequest, getUserId } from '@/server/auth';
import { HttpError, withApiError } from '@/server/errors';
import { subscriptionLinkedTransactionWhere, toDate } from '@/server/linked-transactions';
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

    if (updatedSub.status === 'ACTIVE') {
      const txData = {
        amount: updatedSub.amount,
        date: updatedSub.nextBillingDate,
        notes: `Subscription: ${updatedSub.name}`,
        deletedAt: null,
      };

      const existingTx = await tx.transaction.findFirst({
        where: subscriptionLinkedTransactionWhere(userId, updatedSub.id),
      });

      if (existingTx) {
        await tx.transaction.update({
          where: { id: existingTx.id },
          data: txData,
        });
        if (!updatedSub.transactionId || updatedSub.transactionId !== existingTx.id) {
          await tx.subscription.update({ where: { id: updatedSub.id }, data: { transactionId: existingTx.id } });
          updatedSub.transactionId = existingTx.id;
        }
      } else {
        const transactionId = updatedSub.transactionId || `auto-sub-${updatedSub.id}-${updatedSub.nextBillingDate.toISOString().slice(0, 10)}`;
        const newTx = await tx.transaction.create({
          data: {
            ...txData,
            id: transactionId,
            userId,
            type: 'EXPENSE',
            sourceType: 'subscription',
            sourceId: updatedSub.id,
            subscriptionId: updatedSub.id,
            categoryId: 'TOOLS',
            isAuto: true,
            status: 'COMPLETED',
          },
        });
        await tx.subscription.update({ where: { id: updatedSub.id }, data: { transactionId: newTx.id } });
        updatedSub.transactionId = newTx.id;
      }
    } else {
      await tx.transaction.deleteMany({ where: subscriptionLinkedTransactionWhere(userId, updatedSub.id) });
      if (updatedSub.transactionId) {
        await tx.subscription.update({ where: { id: updatedSub.id }, data: { transactionId: null } });
        updatedSub.transactionId = null;
      }
    }

    return updatedSub;
  });

  return NextResponse.json(subscription);
});
