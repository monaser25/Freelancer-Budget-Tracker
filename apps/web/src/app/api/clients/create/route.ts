import { NextResponse } from 'next/server';
import { authenticateRequest, getUserId } from '@/server/auth';
import { ensureUser } from '@/server/devUser';
import { withApiError } from '@/server/errors';
import { toDate } from '@/server/recurring-billing';
import { prisma } from '@/server/prisma';
import { ClientSchema } from '@/server/validation';
import { syncOneTimeClientTransaction } from '@/server/linked-transactions';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = async (request: Request) => withApiError(request, async () => {
  const user = await authenticateRequest(request);
  const userId = getUserId(user);
  const validated = ClientSchema.parse(await request.json());

  await ensureUser(user);

  const client = await prisma.$transaction(async (tx) => {
    const created = await tx.client.create({
      data: {
        ...validated,
        paymentDate: toDate(validated.paymentDate),
        nextBillingDate: toDate(validated.nextBillingDate),
        archivedAt: toDate(validated.archivedAt),
        userId,
      },
    });
    // A one-time client records its payment immediately so it shows up as
    // revenue / "total paid" instead of $0.
    await syncOneTimeClientTransaction(tx, userId, created);
    return tx.client.findUniqueOrThrow({ where: { id: created.id } });
  });

  return NextResponse.json(client, { status: 201 });
});
