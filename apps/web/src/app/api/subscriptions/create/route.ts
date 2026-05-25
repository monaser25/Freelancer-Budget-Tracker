import { NextResponse } from 'next/server';
import { authenticateRequest, getUserId } from '@/server/auth';
import { ensureUser } from '@/server/devUser';
import { withApiError } from '@/server/errors';
import { toDate } from '@/server/recurring-billing';
import { prisma } from '@/server/prisma';
import { SubscriptionSchema } from '@/server/validation';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = async (request: Request) => withApiError(request, async () => {
  const user = await authenticateRequest(request);
  const userId = getUserId(user);
  const validated = SubscriptionSchema.parse(await request.json());

  await ensureUser(user);

  const billingCycle = validated.billingCycle || validated.cycle;
  const subscription = await prisma.subscription.create({
    data: {
      ...validated,
      cycle: billingCycle,
      billingCycle,
      nextBillingDate: toDate(validated.nextBillingDate) || new Date(),
      archivedAt: toDate(validated.archivedAt),
      userId,
    },
  });

  return NextResponse.json(subscription, { status: 201 });
});
