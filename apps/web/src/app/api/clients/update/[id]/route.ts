import { NextResponse } from 'next/server';
import { authenticateRequest, getUserId } from '@/server/auth';
import { HttpError, withApiError } from '@/server/errors';
import { reconcileClientLinkedTransaction, toDate } from '@/server/linked-transactions';
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

    await reconcileClientLinkedTransaction(tx, userId, updatedClient);
    return tx.client.findUniqueOrThrow({ where: { id: updatedClient.id } });
  });

  return NextResponse.json(client);
});
