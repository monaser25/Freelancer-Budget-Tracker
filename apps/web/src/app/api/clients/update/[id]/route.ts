import { NextResponse } from 'next/server';
import { authenticateRequest, getUserId } from '@/server/auth';
import { HttpError, withApiError } from '@/server/errors';
import { toDate } from '@/server/recurring-billing';
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
    archivedAt: validated.archivedAt !== undefined ? toDate(validated.archivedAt) : undefined,
  };

  const client = await prisma.$transaction(async (tx) => {
    const existingClient = await tx.client.findFirst({ where: { id: params.id, userId } });
    if (!existingClient) throw new HttpError(404, 'Client not found');

    return tx.client.update({
      where: { id: params.id },
      data: dataToUpdate,
    });
  });

  return NextResponse.json(client);
});
