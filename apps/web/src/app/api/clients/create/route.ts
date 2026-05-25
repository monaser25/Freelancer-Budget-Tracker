import { NextResponse } from 'next/server';
import { authenticateRequest, getUserId } from '@/server/auth';
import { ensureUser } from '@/server/devUser';
import { withApiError } from '@/server/errors';
import { reconcileClientLinkedTransaction, toDate } from '@/server/linked-transactions';
import { prisma } from '@/server/prisma';
import { ClientSchema } from '@/server/validation';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = async (request: Request) => withApiError(request, async () => {
  const user = await authenticateRequest(request);
  const userId = getUserId(user);
  const validated = ClientSchema.parse(await request.json());

  await ensureUser(user);

  const client = await prisma.$transaction(async (tx) => {
    const newClient = await tx.client.create({
      data: {
        ...validated,
        paymentDate: toDate(validated.paymentDate),
        nextBillingDate: toDate(validated.nextBillingDate),
        userId,
      },
    });

    await reconcileClientLinkedTransaction(tx, userId, newClient);
    return tx.client.findUniqueOrThrow({ where: { id: newClient.id } });
  });

  return NextResponse.json(client, { status: 201 });
});
