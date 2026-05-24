import { NextResponse } from 'next/server';
import { authenticateRequest, getUserId } from '@/server/auth';
import { ensureUser } from '@/server/devUser';
import { withApiError } from '@/server/errors';
import { getClientTransactionDate, shouldHaveClientTransaction, toDate, todayKey } from '@/server/linked-transactions';
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

    if (shouldHaveClientTransaction(newClient)) {
      const dateKey = getClientTransactionDate(newClient);
      const transactionId = newClient.transactionId || (newClient.paymentType === 'retainer' ? `auto-client-retainer-${newClient.id}` : `auto-client-onetime-${newClient.id}`);
      const newTx = await tx.transaction.create({
        data: {
          id: transactionId,
          userId,
          amount: newClient.revenue,
          type: 'INCOME',
          status: newClient.paymentType === 'onetime' && dateKey <= todayKey() ? 'COMPLETED' : 'PENDING',
          date: toDate(dateKey) || new Date(),
          notes: newClient.paymentType === 'retainer' ? `${newClient.name} retainer` : `${newClient.name} one-time payment`,
          sourceType: 'client',
          sourceId: newClient.id,
          clientId: newClient.id,
          categoryId: 'CLIENT',
          isAuto: true,
        },
      });

      if (!newClient.transactionId) {
        await tx.client.update({
          where: { id: newClient.id },
          data: { transactionId: newTx.id },
        });
        newClient.transactionId = newTx.id;
      }
    }

    return newClient;
  });

  return NextResponse.json(client, { status: 201 });
});
