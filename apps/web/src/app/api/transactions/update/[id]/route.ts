import { NextResponse } from 'next/server';
import { authenticateRequest, getUserId } from '@/server/auth';
import { HttpError, withApiError } from '@/server/errors';
import { toDate } from '@/server/recurring-billing';
import { prisma } from '@/server/prisma';
import { TransactionSchema } from '@/server/validation';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: { id: string } };

// Editing a transaction only edits THIS single historical ledger row.
// It never rewrites past auto-generated rows or changes future billing
// settings on the source client / subscription. For auto rows, we still
// allow edits (name / amount / notes / date) but mark isEdited = true so
// it is visible that the row diverged from its generator.
export const PUT = async (request: Request, { params }: RouteContext) => withApiError(request, async () => {
  const user = await authenticateRequest(request);
  const userId = getUserId(user);
  const validated = TransactionSchema.partial().parse(await request.json());

  const existing = await prisma.transaction.findFirst({
    where: { id: params.id, userId, deletedAt: null },
  });

  if (!existing) throw new HttpError(404, 'Transaction not found');

  // For auto-generated rows we accept edits but lock down the linkage
  // fields so the row keeps pointing at its source client/subscription.
  const isAuto = Boolean(existing.isAuto) || existing.sourceType !== 'manual';
  const safeUpdate = isAuto
    ? {
        name: validated.name,
        amount: validated.amount,
        notes: validated.notes,
        date: validated.date ? toDate(validated.date) : undefined,
        status: validated.status,
      }
    : {
        ...validated,
        date: validated.date ? toDate(validated.date) : undefined,
        sourceBillingDate: validated.sourceBillingDate ? toDate(validated.sourceBillingDate) : undefined,
      };

  await prisma.transaction.updateMany({
    where: { id: params.id, userId, deletedAt: null },
    data: {
<<<<<<< HEAD
      ...safeUpdate,
      isEdited: isAuto ? true : validated.isEdited ?? existing.isEdited,
=======
      ...validated,
      date: validated.date ? toDate(validated.date) : undefined,
      sourceBillingDate: validated.sourceBillingDate ? toDate(validated.sourceBillingDate) : undefined,
      isEdited: existing.isAuto ? true : validated.isEdited ?? existing.isEdited,
>>>>>>> 8dff0d787412a023feb47cd94d0d5457c2fb31c8
    },
  });

  const transaction = await prisma.transaction.findFirst({ where: { id: params.id, userId } });
  return NextResponse.json(transaction);
});
