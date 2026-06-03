import { NextResponse } from 'next/server';
import { authenticateRequest, getUserId } from '@/server/auth';
import { ensureUser } from '@/server/devUser';
import { withApiError } from '@/server/errors';
import { toDate } from '@/server/recurring-billing';
import { prisma } from '@/server/prisma';
import { InvoiceSchema } from '@/server/validation';
import { computeInvoiceTotals, nextInvoiceNumber } from '@/server/invoices';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = async (request: Request) => withApiError(request, async () => {
  const user = await authenticateRequest(request);
  const userId = getUserId(user);
  const data = InvoiceSchema.parse(await request.json());

  await ensureUser(user);

  const { items, subtotal, taxAmount, total } = computeInvoiceTotals(data.lineItems, data.taxRate, data.discount);

  const invoice = await prisma.$transaction(async (tx) => {
    const number = data.number?.trim() || (await nextInvoiceNumber(tx, userId));
    return tx.invoice.create({
      data: {
        number,
        clientId: data.clientId || null,
        issueDate: toDate(data.issueDate)!,
        dueDate: toDate(data.dueDate)!,
        status: data.status,
        currency: data.currency,
        subtotal,
        taxRate: data.taxRate,
        taxAmount,
        discount: data.discount,
        total,
        notes: data.notes || null,
        terms: data.terms || null,
        sentAt: data.status === 'SENT' ? new Date() : null,
        userId,
        lineItems: { create: items },
      },
      include: {
        lineItems: { orderBy: { position: 'asc' } },
        client: { select: { id: true, name: true, company: true, email: true } },
      },
    });
  });

  return NextResponse.json(invoice, { status: 201 });
});
