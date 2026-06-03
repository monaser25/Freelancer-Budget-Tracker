import { NextResponse } from 'next/server';
import { authenticateRequest, getUserId } from '@/server/auth';
import { withApiError, HttpError } from '@/server/errors';
import { prisma } from '@/server/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Marks an invoice as sent. Actual email delivery is a follow-up (requires a
// mail provider); for now this records the sent state + timestamp.
export const POST = async (request: Request, { params }: { params: { id: string } }) =>
  withApiError(request, async () => {
    const user = await authenticateRequest(request);
    const userId = getUserId(user);

    const existing = await prisma.invoice.findFirst({ where: { id: params.id, userId } });
    if (!existing) throw new HttpError(404, 'Invoice not found');
    if (existing.status === 'PAID') throw new HttpError(400, 'Invoice is already paid');

    const invoice = await prisma.invoice.update({
      where: { id: params.id },
      data: { status: 'SENT', sentAt: existing.sentAt ?? new Date() },
      include: { lineItems: { orderBy: { position: 'asc' } }, client: { select: { id: true, name: true, company: true, email: true } } },
    });

    return NextResponse.json(invoice);
  });
