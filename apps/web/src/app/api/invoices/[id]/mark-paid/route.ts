import { NextResponse } from 'next/server';
import { authenticateRequest, getUserId } from '@/server/auth';
import { withApiError, HttpError } from '@/server/errors';
import { prisma } from '@/server/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = async (request: Request, { params }: { params: { id: string } }) =>
  withApiError(request, async () => {
    const user = await authenticateRequest(request);
    const userId = getUserId(user);

    const invoice = await prisma.invoice.findFirst({ where: { id: params.id, userId } });
    if (!invoice) throw new HttpError(404, 'Invoice not found');
    if (invoice.status === 'PAID') {
      const full = await prisma.invoice.findUnique({
        where: { id: invoice.id },
        include: { lineItems: { orderBy: { position: 'asc' } }, client: { select: { id: true, name: true, company: true, email: true } } },
      });
      return NextResponse.json({ invoice: full, transaction: null });
    }

    const paidAt = new Date();

    const result = await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          name: `Payment — ${invoice.number}`,
          amount: invoice.total,
          type: 'INCOME',
          status: 'COMPLETED',
          date: paidAt,
          notes: null,
          sourceType: 'invoice',
          sourceId: invoice.id,
          categoryId: 'CLIENT',
          clientId: invoice.clientId,
          isAuto: true,
          userId,
        },
      });

      const updated = await tx.invoice.update({
        where: { id: invoice.id },
        data: { status: 'PAID', paidAt, transactionId: transaction.id },
        include: { lineItems: { orderBy: { position: 'asc' } }, client: { select: { id: true, name: true, company: true, email: true } } },
      });

      return { invoice: updated, transaction };
    });

    // Best-effort notification — created outside the transaction so a dedupe
    // collision can never roll back the payment.
    await prisma.notification
      .create({
        data: {
          type: 'PAYMENT_RECORDED',
          title: `Payment recorded for ${invoice.number}`,
          body: `Marked ${invoice.number} as paid.`,
          link: '/invoices',
          refKey: `invoice-paid:${invoice.id}`,
          userId,
        },
      })
      .catch(() => undefined);

    return NextResponse.json(result);
  });
