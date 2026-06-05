'use client';

import { useEffect, useState } from 'react';
import { useInvoiceStore } from '@/store/invoiceStore';
import { downloadInvoicePdf, InvoiceSendError } from '@/services/financialApi';
import { formatCurrency } from '@/lib/format';
import { useLocale } from '@/lib/i18n';
import type { Locale } from '@/lib/locales';
import type { Invoice } from '@/types/finance';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Field, Input, Textarea } from '@/components/ui/Form';
import { InlineAlert } from '@/components/ui/InlineAlert';
import { Icon } from '@/components/ui/Icon';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type SendableInvoice = {
  id: string;
  number: string;
  currency: string;
  total: number;
  dueDate: string;
  client?: { name?: string | null; email?: string | null } | null;
};

const money = (n: number, currency: string, locale: Locale) => {
  try {
    return formatCurrency(n, currency || 'USD', locale, { minimumFractionDigits: 2 });
  } catch {
    return String(n);
  }
};

export function SendInvoiceModal({
  open,
  onClose,
  invoice,
  onSent,
}: {
  open: boolean;
  onClose: () => void;
  invoice: SendableInvoice;
  onSent?: (updated: Invoice) => void;
}) {
  const { send } = useInvoiceStore();
  const { locale } = useLocale();
  const [to, setTo] = useState('');
  const [message, setMessage] = useState('');
  const [view, setView] = useState<'form' | 'success' | 'fallback'>('form');
  const [sending, setSending] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState('');

  // Reset + prefill whenever the modal opens.
  useEffect(() => {
    if (open) {
      setTo(invoice.client?.email || '');
      setMessage('');
      setView('form');
      setSending(false);
      setError(null);
    }
  }, [open, invoice.client?.email]);

  const emailValid = EMAIL_RE.test(to.trim());

  const triggerBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const downloadPdf = async () => {
    setDownloading(true);
    setError(null);
    try {
      const { blob, filename } = await downloadInvoicePdf(invoice.id);
      triggerBlob(blob, filename);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not download the PDF.');
    } finally {
      setDownloading(false);
    }
  };

  const mailtoHref = () => {
    const subject = `Invoice ${invoice.number} from Haseeela`;
    const body =
      (message.trim() ? `${message.trim()}\n\n` : '') +
      `Invoice ${invoice.number}\nAmount due: ${money(invoice.total, invoice.currency, locale)}\nDue: ${invoice.dueDate}`;
    return `mailto:${encodeURIComponent(to.trim())}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const submit = async () => {
    setError(null);
    if (!emailValid) {
      setError('Please enter a valid recipient email address.');
      return;
    }
    setSending(true);
    try {
      const result = await send(invoice.id, { to: to.trim(), message: message.trim() || undefined });
      setSentTo(result.sentTo || to.trim());
      onSent?.(result.invoice);
      setView('success');
    } catch (e) {
      if (e instanceof InvoiceSendError && e.code === 'smtp_not_configured') {
        setView('fallback');
        return;
      }
      setError(e instanceof Error ? e.message : 'Failed to send invoice.');
    } finally {
      setSending(false);
    }
  };

  // ── Success ──
  if (view === 'success') {
    return (
      <Modal open={open} onClose={onClose} title="Invoice sent" maxWidth={460}>
        <div className="flex flex-col items-center text-center gap-3 py-2">
          <div className="w-12 h-12 rounded-full bg-positive-tint text-positive flex items-center justify-center">
            <Icon name="checkCircle" size={24} />
          </div>
          <p className="t-body text-text-secondary">
            Invoice {invoice.number} was emailed to <span className="text-text font-medium">{sentTo}</span> and marked as sent.
          </p>
          <Button className="w-full mt-2" onClick={onClose}>Done</Button>
        </div>
      </Modal>
    );
  }

  // ── SMTP-not-configured fallback ──
  if (view === 'fallback') {
    return (
      <Modal open={open} onClose={onClose} title="Email isn't set up yet" maxWidth={480}>
        <div className="flex flex-col gap-4">
          <InlineAlert tone="warning" title="SMTP is not configured" body="Automatic email sending isn't configured yet, so the invoice was not sent or marked as sent. Use one of these instead:" />
          {error && <InlineAlert tone="negative" body={error} />}
          <div className="flex flex-col gap-2">
            <Button icon="download" loading={downloading} onClick={downloadPdf} className="w-full">
              Download invoice PDF
            </Button>
            <a href={mailtoHref()} className="w-full">
              <Button variant="secondary" icon="send" className="w-full">Open in my email app</Button>
            </a>
          </div>
          <p className="t-small text-text-muted">
            To enable one-click sending, add the SMTP environment variables in Vercel (see docs/SMTP_EMAIL_SETUP.md).
          </p>
        </div>
        <div className="flex justify-end mt-4">
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </div>
      </Modal>
    );
  }

  // ── Form ──
  return (
    <Modal
      open={open}
      onClose={() => !sending && onClose()}
      title={`Send invoice ${invoice.number}`}
      description={`${money(invoice.total, invoice.currency, locale)} · due ${invoice.dueDate}`}
      dismissable={!sending}
      maxWidth={480}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={sending}>Cancel</Button>
          <Button icon="send" loading={sending} disabled={!emailValid} onClick={submit}>Send invoice</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {error && <InlineAlert tone="negative" title="Couldn't send" body={error} />}
        <Field label="Recipient email" error={to.length > 0 && !emailValid ? 'Enter a valid email address' : undefined}>
          <Input
            type="email"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="client@email.com"
            autoFocus
          />
        </Field>
        <Field label="Message" hint="Optional — added to the email body">
          <Textarea
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={`Hi ${invoice.client?.name || 'there'}, please find your invoice attached.`}
          />
        </Field>
        <p className="t-small text-text-muted">
          A branded PDF is attached automatically. The invoice is marked <span className="font-medium">Sent</span> only after the email is delivered.
        </p>
      </div>
    </Modal>
  );
}
