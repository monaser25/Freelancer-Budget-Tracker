import { NextResponse } from 'next/server';
import { authenticateRequest, getUserId } from '@/server/auth';
import { HttpError, withApiError } from '@/server/errors';
import { prisma } from '@/server/prisma';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: { id: string } };

// Deletes a single transaction row, manual or auto-generated.
// - For manual rows: removes the ledger entry as expected.
// - For auto-generated rows: removes the specific historical payment record
//   only. The source client/subscription stays active and future billing is
//   not affected because the source's nextBillingDate has already advanced
//   past this row's billing date by the time we get here.
export const DELETE = async (request: Request, { params }: RouteContext) => withApiError(request, async () => {
  const user = await authenticateRequest(request);
  const userId = getUserId(user);

  const existing = await prisma.transaction.findFirst({
    where: { id: params.id, userId, deletedAt: null },
  });

  if (!existing) throw new HttpError(404, 'Transaction not found');

  await prisma.transaction.deleteMany({
    where: { id: params.id, userId },
  });

  return NextResponse.json({ success: true });
});
