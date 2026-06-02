import { NextResponse } from 'next/server';
import { authenticateRequest, getUserId } from '@/server/auth';
import { HttpError, withApiError } from '@/server/errors';
import { prisma } from '@/server/prisma';
import { clientLinkedTransactionWhere } from '@/server/linked-transactions';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: { id: string } };

export const DELETE = async (request: Request, { params }: RouteContext) => withApiError(request, async () => {
  const user = await authenticateRequest(request);
  const userId = getUserId(user);

  await prisma.$transaction(async (tx) => {
    const existing = await tx.client.findFirst({ where: { id: params.id, userId } });
    if (!existing) throw new HttpError(404, 'Client not found');

    await tx.transaction.deleteMany({ where: clientLinkedTransactionWhere(userId, params.id) });
    await tx.client.delete({ where: { id: params.id } });
  });

  return NextResponse.json({ id: params.id });
});
