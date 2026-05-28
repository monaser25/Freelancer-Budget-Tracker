import { NextResponse } from 'next/server';
import { authenticateRequest, getUserId } from '@/server/auth';
import { recordClientPayment, toDate } from '@/server/recurring-billing';
import { prisma } from '@/server/prisma';
import { withApiError } from '@/server/errors';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: { id: string } };

export const POST = async (request: Request, { params }: RouteContext) => withApiError(request, async () => {
  const user = await authenticateRequest(request);
  const userId = getUserId(user);
  const body = await request.json().catch(() => ({}));
  const today = toDate(body.today) || new Date();

  const result = await prisma.$transaction((tx) => recordClientPayment(tx, userId, params.id, today));
  return NextResponse.json(result, { status: 201 });
});
