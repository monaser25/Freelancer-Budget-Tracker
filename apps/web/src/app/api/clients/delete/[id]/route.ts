import { NextResponse } from 'next/server';
import { authenticateRequest, getUserId } from '@/server/auth';
import { HttpError, withApiError } from '@/server/errors';
import { clientLinkedTransactionWhere } from '@/server/linked-transactions';
import { prisma } from '@/server/prisma';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: { id: string } };

export const DELETE = async (request: Request, { params }: RouteContext) => withApiError(request, async () => {
  const user = await authenticateRequest(request);
  const userId = getUserId(user);

  const result = await prisma.$transaction(async (tx) => {
    await tx.transaction.deleteMany({ where: clientLinkedTransactionWhere(userId, params.id) });
    return tx.client.deleteMany({ where: { id: params.id, userId } });
  });

  if (result.count === 0) throw new HttpError(404, 'Client not found');

  return NextResponse.json({ success: true });
});
