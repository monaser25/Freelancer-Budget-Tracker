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

  const existing = await prisma.subscription.findFirst({ where: { id: params.id, userId } });
  if (!existing) throw new HttpError(404, 'Subscription not found');

  const subscription = await prisma.subscription.update({
    where: { id: params.id },
    data: { status: 'INACTIVE', archivedAt: new Date() },
  });

  return NextResponse.json(subscription);
});
