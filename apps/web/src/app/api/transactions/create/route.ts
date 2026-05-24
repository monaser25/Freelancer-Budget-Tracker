import { NextResponse } from 'next/server';
import { authenticateRequest, getUserId } from '@/server/auth';
import { ensureUser } from '@/server/devUser';
import { HttpError, withApiError } from '@/server/errors';
import { toDate } from '@/server/linked-transactions';
import { prisma } from '@/server/prisma';
import { TransactionSchema } from '@/server/validation';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = async (request: Request) => withApiError(request, async () => {
  const user = await authenticateRequest(request);
  const userId = getUserId(user);
  const validated = TransactionSchema.parse(await request.json());

  if (validated.sourceType !== 'manual') {
    throw new HttpError(400, 'Only manual transactions can be created directly');
  }

  await ensureUser(user);

  const transaction = await prisma.transaction.create({
    data: {
      ...validated,
      date: toDate(validated.date) || new Date(),
      userId,
    },
  });

  return NextResponse.json(transaction, { status: 201 });
});
