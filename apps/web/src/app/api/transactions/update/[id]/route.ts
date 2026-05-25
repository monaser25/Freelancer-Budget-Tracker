import { NextResponse } from 'next/server';
import { authenticateRequest, getUserId } from '@/server/auth';
import { HttpError, withApiError } from '@/server/errors';
import { toDate } from '@/server/recurring-billing';
import { prisma } from '@/server/prisma';
import { TransactionSchema } from '@/server/validation';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: { id: string } };

export const PUT = async (request: Request, { params }: RouteContext) => withApiError(request, async () => {
  const user = await authenticateRequest(request);
  const userId = getUserId(user);
  const validated = TransactionSchema.partial().parse(await request.json());

  const existing = await prisma.transaction.findFirst({
    where: { id: params.id, userId, deletedAt: null },
  });

  if (!existing) throw new HttpError(404, 'Transaction not found');
  if (existing.sourceType !== 'manual') {
    throw new HttpError(400, 'Linked transactions cannot be edited directly');
  }

  await prisma.transaction.updateMany({
    where: { id: params.id, userId, deletedAt: null },
    data: {
      ...validated,
      date: validated.date ? toDate(validated.date) : undefined,
      sourceBillingDate: validated.sourceBillingDate ? toDate(validated.sourceBillingDate) : undefined,
      isEdited: existing.isAuto ? true : validated.isEdited ?? existing.isEdited,
    },
  });

  const transaction = await prisma.transaction.findFirst({ where: { id: params.id, userId } });
  return NextResponse.json(transaction);
});
