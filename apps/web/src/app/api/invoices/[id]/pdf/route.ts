import { NextResponse } from 'next/server';
import { authenticateRequest, getUserId } from '@/server/auth';
import { withApiError, HttpError } from '@/server/errors';
import { prisma } from '@/server/prisma';
import { buildInvoicePdf } from '@/server/invoicePdf';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Returns a branded, downloadable PDF of the invoice. Used by the "Download PDF"
// action (including the SMTP-not-configured fallback).
export const GET = async (request: Request, { params }: { params: { id: string } }) =>
  withApiError(request, async () => {
    const user = await authenticateRequest(request);
    const userId = getUserId(user);

    const existing = await prisma.invoice.findFirst({
      where: { id: params.id, userId },
      include: { lineItems: { orderBy: { position: 'asc' } }, client: { select: { name: true, company: true, email: true } } },
    });
    if (!existing) throw new HttpError(404, 'Invoice not found');

    const pdf = await buildInvoicePdf({
      number: existing.number,
      status: existing.status,
      currency: existing.currency,
      issueDate: existing.issueDate,
      dueDate: existing.dueDate,
      paidAt: existing.paidAt,
      client: existing.client,
      lineItems: existing.lineItems.map((li) => ({ description: li.description, quantity: li.quantity, rate: li.rate })),
      taxRate: existing.taxRate,
      discount: existing.discount,
      notes: existing.notes,
      terms: existing.terms,
      fromName: user.name || 'Haseeela',
      fromEmail: user.email,
    });

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${existing.number}.pdf"`,
      },
    });
  });
