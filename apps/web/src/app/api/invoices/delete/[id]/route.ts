import { NextResponse } from 'next/server';
import { authenticateRequest, getUserId } from '@/server/auth';
import { withApiError, HttpError } from '@/server/errors';
import { prisma } from '@/server/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const DELETE = async (request: Request, { params }: { params: { id: string } }) =>
  withApiError(request, async () => {
    const user = await authenticateRequest(request);
    const userId = getUserId(user);

    const existing = await prisma.invoice.findFirst({ where: { id: params.id, userId } });
    if (!existing) throw new HttpError(404, 'Invoice not found');

    // Line items cascade on delete via the FK.
    await prisma.invoice.delete({ where: { id: params.id } });

    return NextResponse.json({ id: params.id });
  });
