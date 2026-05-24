import { NextResponse } from 'next/server';
import { authenticateRequest, getUserId } from '@/server/auth';
import { HttpError, withApiError } from '@/server/errors';
import { prisma } from '@/server/prisma';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: { id: string } };

export const DELETE = async (request: Request, { params }: RouteContext) => withApiError(request, async () => {
  const user = await authenticateRequest(request);
  const userId = getUserId(user);

  const existing = await prisma.transaction.findFirst({
    where: { id: params.id, userId, deletedAt: null },
  });

  if (!existing) throw new HttpError(404, 'Transaction not found');
  if (existing.sourceType !== 'manual') {
    throw new HttpError(400, 'Linked transactions cannot be deleted directly');
  }

  await prisma.transaction.deleteMany({
    where: { id: params.id, userId },
  });

  return NextResponse.json({ success: true });
});
