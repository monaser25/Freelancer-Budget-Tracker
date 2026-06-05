import { NextResponse } from 'next/server';
import { authenticateRequest, getUserId } from '@/server/auth';
import { withApiError, HttpError } from '@/server/errors';
import { prisma } from '@/server/prisma';
import { isSmtpConfigured, sendMail, SmtpError, isValidEmail } from '@/server/email';
import { renderBrandedEmail } from '@/server/emailTemplate';
import { buildInvoicePdf } from '@/server/invoicePdf';
import { formatCurrency, formatDate } from '@/lib/format';
import { DEFAULT_LOCALE } from '@/lib/locales';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const money = (n: number, currency: string) => {
  try {
    return formatCurrency(n, currency || 'USD', DEFAULT_LOCALE, { minimumFractionDigits: 2 });
  } catch {
    return n.toFixed(2);
  }
};
const fmtDate = (v: Date | string | null) =>
  v ? formatDate(v, DEFAULT_LOCALE, { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

// Send an invoice by email via SMTP. The invoice is marked SENT *only* after a
// successful send. If SMTP isn't configured, returns a 503 with a machine code
// so the client can show the PDF/mailto fallback — it does NOT mark the invoice.
export const POST = async (request: Request, { params }: { params: { id: string } }) =>
  withApiError(request, async () => {
    const user = await authenticateRequest(request);
    const userId = getUserId(user);

    const body = await request.json().catch(() => ({}));
    const to = String(body?.to ?? '').trim();
    const message = String(body?.message ?? '').trim();

    if (!to || !isValidEmail(to)) {
      throw new HttpError(400, 'Please enter a valid recipient email address.');
    }

    // Refuse before doing any work if email isn't set up — never mark as sent.
    if (!isSmtpConfigured()) {
      return NextResponse.json(
        { error: 'Email sending is not configured. Download the PDF or use your mail app instead.', code: 'smtp_not_configured' },
        { status: 503 },
      );
    }

    const existing = await prisma.invoice.findFirst({
      where: { id: params.id, userId },
      include: { lineItems: { orderBy: { position: 'asc' } }, client: { select: { id: true, name: true, company: true, email: true } } },
    });
    if (!existing) throw new HttpError(404, 'Invoice not found');
    if (existing.status === 'PAID') throw new HttpError(400, 'This invoice is already paid.');

    // Build the branded PDF; if it fails, still send (HTML summary) without attachment.
    let attachment: { filename: string; content: Buffer; contentType: string } | null = null;
    try {
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
      attachment = { filename: `invoice-${existing.number}.pdf`, content: pdf, contentType: 'application/pdf' };
    } catch {
      attachment = null; // PDF generation failed — fall back to HTML-only email.
    }

    const clientName = existing.client?.name || 'there';
    const defaultIntro =
      `Hi ${clientName},\n\nPlease find invoice ${existing.number} ${attachment ? 'attached' : 'summarised below'}. ` +
      `The total due is ${money(existing.total, existing.currency)}, due by ${fmtDate(existing.dueDate)}.\n\nThank you for your business.`;

    const html = renderBrandedEmail({
      preheader: `Invoice ${existing.number} · ${money(existing.total, existing.currency)} due ${fmtDate(existing.dueDate)}`,
      heading: `Invoice ${existing.number}`,
      intro: message || defaultIntro,
      detailRows: [
        { label: 'Invoice', value: existing.number },
        { label: 'Issued', value: fmtDate(existing.issueDate) },
        { label: 'Due', value: fmtDate(existing.dueDate) },
        { label: 'Amount due', value: money(existing.total, existing.currency), strong: true },
      ],
      footnote: attachment ? undefined : "We couldn't attach a PDF this time — the invoice details are summarised above.",
    });

    try {
      await sendMail({
        to,
        subject: `Invoice ${existing.number} from ${user.name || 'Haseeela'}`,
        html,
        text: message || defaultIntro,
        replyTo: user.email,
        attachments: attachment ? [attachment] : undefined,
      });
    } catch (err) {
      if (err instanceof SmtpError) {
        const status = err.code === 'not_configured' ? 503 : 502;
        return NextResponse.json({ error: err.message, code: `smtp_${err.code}` }, { status });
      }
      throw err;
    }

    // Mark as SENT only now that the email actually went out.
    const invoice = await prisma.invoice.update({
      where: { id: params.id },
      data: { status: 'SENT', sentAt: existing.sentAt ?? new Date() },
      include: { lineItems: { orderBy: { position: 'asc' } }, client: { select: { id: true, name: true, company: true, email: true } } },
    });

    return NextResponse.json({ invoice, attached: attachment !== null, sentTo: to });
  });
