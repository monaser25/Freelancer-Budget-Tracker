import { NextResponse } from 'next/server';
import { authenticateRequest, getUserId } from '@/server/auth';
import { HttpError, withApiError } from '@/server/errors';
import { clientLinkedTransactionWhere, getClientTransactionDate, shouldHaveClientTransaction, toDate, todayKey } from '@/server/linked-transactions';
import { prisma } from '@/server/prisma';
import { ClientSchema } from '@/server/validation';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: { id: string } };

export const PUT = async (request: Request, { params }: RouteContext) => withApiError(request, async () => {
  const user = await authenticateRequest(request);
  const userId = getUserId(user);
  const validated = ClientSchema.partial().parse(await request.json());

  const dataToUpdate = {
    ...validated,
    paymentDate: validated.paymentDate !== undefined ? toDate(validated.paymentDate) : undefined,
    nextBillingDate: validated.nextBillingDate !== undefined ? toDate(validated.nextBillingDate) : undefined,
  };

  const client = await prisma.$transaction(async (tx) => {
    const existingClient = await tx.client.findFirst({ where: { id: params.id, userId } });
    if (!existingClient) throw new HttpError(404, 'Client not found');

    const updatedClient = await tx.client.update({
      where: { id: params.id },
      data: dataToUpdate,
    });

    if (shouldHaveClientTransaction(updatedClient)) {
      const dateKey = getClientTransactionDate(updatedClient);
      const txData = {
        amount: updatedClient.revenue,
        date: toDate(dateKey) || new Date(),
        notes: updatedClient.paymentType === 'retainer' ? `${updatedClient.name} retainer` : `${updatedClient.name} one-time payment`,
        status: updatedClient.paymentType === 'onetime' && dateKey <= todayKey() ? 'COMPLETED' : 'PENDING',
        deletedAt: null,
      };

      const existingTx = await tx.transaction.findFirst({
        where: clientLinkedTransactionWhere(userId, updatedClient.id),
      });

      if (existingTx) {
        await tx.transaction.update({
          where: { id: existingTx.id },
          data: txData,
        });
        if (!updatedClient.transactionId || updatedClient.transactionId !== existingTx.id) {
          await tx.client.update({ where: { id: updatedClient.id }, data: { transactionId: existingTx.id } });
          updatedClient.transactionId = existingTx.id;
        }
      } else {
        const transactionId = updatedClient.transactionId || (updatedClient.paymentType === 'retainer' ? `auto-client-retainer-${updatedClient.id}` : `auto-client-onetime-${updatedClient.id}`);
        const newTx = await tx.transaction.create({
          data: {
            ...txData,
            id: transactionId,
            userId,
            type: 'INCOME',
            sourceType: 'client',
            sourceId: updatedClient.id,
            clientId: updatedClient.id,
            categoryId: 'CLIENT',
            isAuto: true,
          },
        });
        await tx.client.update({ where: { id: updatedClient.id }, data: { transactionId: newTx.id } });
        updatedClient.transactionId = newTx.id;
      }
    } else {
      await tx.transaction.deleteMany({ where: clientLinkedTransactionWhere(userId, updatedClient.id) });
      if (updatedClient.transactionId) {
        await tx.client.update({ where: { id: updatedClient.id }, data: { transactionId: null } });
        updatedClient.transactionId = null;
      }
    }

    return updatedClient;
  });

  return NextResponse.json(client);
});
