import { NextResponse } from 'next/server';
import { authenticateRequest, getUserId } from '@/server/auth';
import { HttpError, withApiError } from '@/server/errors';
import { toDate } from '@/server/recurring-billing';
import { prisma } from '@/server/prisma';
import { SubscriptionSchema } from '@/server/validation';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: { id: string } };

export const PUT = async (request: Request, { params }: RouteContext) => withApiError(request, async () => {
  const user = await authenticateRequest(request);
  const userId = getUserId(user);
  const validated = SubscriptionSchema.partial().parse(await request.json());

  const billingCycle = validated.billingCycle || validated.cycle;
  const dataToUpdate = {
    ...validated,
    cycle: billingCycle,
    billingCycle,
    nextBillingDate: validated.nextBillingDate !== undefined ? toDate(validated.nextBillingDate) : undefined,
    archivedAt: validated.archivedAt !== undefined ? toDate(validated.archivedAt) : undefined,
  };

  const subscription = await prisma.$transaction(async (tx) => {
    const existingSub = await tx.subscription.findFirst({ where: { id: params.id, userId } });
    if (!existingSub) throw new HttpError(404, 'Subscription not found');

    return tx.subscription.update({
      where: { id: params.id },
      data: dataToUpdate,
    });
  });

  return NextResponse.json(subscription);
});
