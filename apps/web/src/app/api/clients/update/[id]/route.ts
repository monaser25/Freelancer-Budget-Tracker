import { NextResponse } from 'next/server';
import { authenticateRequest, getUserId } from '@/server/auth';
import { HttpError, withApiError } from '@/server/errors';
import { toDate } from '@/server/recurring-billing';
import { prisma } from '@/server/prisma';
import { ClientSchema } from '@/server/validation';
import { syncOneTimeClientTransaction } from '@/server/linked-transactions';

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
    archivedAt: validated.archivedAt !== undefined ? toDate(validated.archivedAt) : undefined,
  };

  const client = await prisma.$transaction(async (tx) => {
    const existingClient = await tx.client.findFirst({ where: { id: params.id, userId } });
    if (!existingClient) throw new HttpError(404, 'Client not found');

    const updated = await tx.client.update({
      where: { id: params.id },
      data: dataToUpdate,
    });
    // Keep the one-time client's income transaction in step with edits to its
    // amount, payment date, status, or payment type.
    await syncOneTimeClientTransaction(tx, userId, updated);
    return tx.client.findUniqueOrThrow({ where: { id: params.id } });
  });

  return NextResponse.json(client);
});
