import { NextResponse } from 'next/server';
import { authenticateRequest, getUserId } from '@/server/auth';
import { clientLinkedTransactionWhere } from '@/server/linked-transactions';
import { prisma } from '@/server/prisma';
import { withApiError } from '@/server/errors';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: { id: string } };

export const GET = async (request: Request, { params }: RouteContext) => withApiError(request, async () => {
  const user = await authenticateRequest(request);
  const userId = getUserId(user);
  const count = await prisma.transaction.count({
    where: {
      ...clientLinkedTransactionWhere(userId, params.id),
      deletedAt: null,
    },
  });

  return NextResponse.json({ count });
});
