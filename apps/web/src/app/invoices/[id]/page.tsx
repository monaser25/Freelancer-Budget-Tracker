'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useInvoiceStore } from '@/store/invoiceStore';
import { InvoiceStatus } from '@/types/finance';
import { formatDate } from '@/lib/format';
import { useLocale } from '@/lib/i18n';
import type { Locale } from '@/lib/locales';
import { Button, IconButton } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { InvoiceDocument } from '@/components/invoices/InvoiceDocument';
import { SendInvoiceModal } from '@/components/invoices/SendInvoiceModal';

const statusTone = (s: InvoiceStatus) =>
  s === 'PAID' ? 'positive' : s === 'OVERDUE' ? 'negative' : s === 'SENT' ? 'info' : 'neutral';
const fmtDate = (v: string | null | undefined, locale: Locale) => (v ? formatDate(v, locale, { month: 'short', day: 'numeric', year: 'numeric' }) : '—');

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { locale } = useLocale();
  const id = String(params.id);
  const { isLoaded, loadInvoices, getInvoice, markPaid, deleteInvoice } = useInvoiceStore();
  const { toast } = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmDel, setConfirmDel] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);

  const searchParams = useSearchParams();

  useEffect(() => {
    if (!isLoaded) loadInvoices();
  }, [isLoaded, loadInvoices]);

  const invoice = getInvoice(id);

  // Opened from the editor's "Create & send" → launch the Send modal once.
  useEffect(() => {
    if (invoice && invoice.status !== 'PAID' && searchParams.get('send') === '1') {
      setSendOpen(true);
      window.history.replaceState(null, '', `/invoices/${id}`);
    }
  }, [invoice, searchParams, id]);

  if (!isLoaded) return <div className="py-24 text-center text-text-muted text-[13px]">Loading invoice…</div>;
  if (!invoice) {
    return (
      <div className="py-24 text-center">
        <p className="t-body text-text-muted">Invoice not found.</p>
        <button onClick={() => router.push('/invoices')} className="mt-3 t-body-m text-accent hover:underline">Back to invoices</button>
      </div>
    );
  }

  const run = async (label: string, fn: () => Promise<void>, success: string) => {
    setBusy(label);
    try {
      await fn();
      toast(success);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Action failed', 'error');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3 flex-wrap">
        <IconButton icon="arrowLeft" title="Back" onClick={() => router.push('/invoices')} />
        <h1 className="t-h1">{invoice.number}</h1>
        <Badge tone={statusTone(invoice.status)}>{invoice.status[0] + invoice.status.slice(1).toLowerCase()}</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">
        <InvoiceDocument
          data={{
            number: invoice.number,
            issueDate: invoice.issueDate,
            dueDate: invoice.dueDate,
            currency: invoice.currency,
            clientName: invoice.client?.name,
            clientCompany: invoice.client?.company,
            clientEmail: invoice.client?.email,
            lineItems: invoice.lineItems.map((li) => ({ description: li.description, quantity: li.quantity, rate: li.rate })),
            taxRate: invoice.taxRate,
            discount: invoice.discount,
            notes: invoice.notes,
            terms: invoice.terms,
          }}
        />

        {/* Side panel (hidden on print) */}
        <div className="flex flex-col gap-4 print:hidden">
          <Card pad={18} className="flex flex-col gap-3">
            <div className="t-caption text-text-muted">Status</div>
            <Badge tone={statusTone(invoice.status)} className="self-start">{invoice.status[0] + invoice.status.slice(1).toLowerCase()}</Badge>
            <div className="flex justify-between t-small"><span className="text-text-muted">Issued</span><span className="tnum">{fmtDate(invoice.issueDate, locale)}</span></div>
            <div className="flex justify-between t-small"><span className="text-text-muted">Due</span><span className="tnum">{fmtDate(invoice.dueDate, locale)}</span></div>
            {invoice.paidAt && <div className="flex justify-between t-small"><span className="text-text-muted">Paid</span><span className="tnum text-positive">{fmtDate(invoice.paidAt, locale)}</span></div>}
            {invoice.client && <div className="flex justify-between t-small"><span className="text-text-muted">Client</span><span>{invoice.client.name}</span></div>}
          </Card>

          <Card pad={18} className="flex flex-col gap-2">
            {invoice.status !== 'PAID' && (
              <Button icon="checkCircle" className="w-full" loading={busy === 'paid'} onClick={() => run('paid', () => markPaid(invoice.id), 'Marked as paid — income recorded')}>
                Mark as paid
              </Button>
            )}
            {invoice.status !== 'PAID' && (
              <Button variant="secondary" icon="send" className="w-full" onClick={() => setSendOpen(true)}>
                {invoice.status === 'SENT' ? 'Resend invoice' : 'Send invoice'}
              </Button>
            )}
            {invoice.status !== 'PAID' && (
              <Button variant="secondary" icon="pencil" className="w-full" onClick={() => router.push(`/invoices/${invoice.id}/edit`)}>Edit</Button>
            )}
            <Button variant="secondary" icon="download" className="w-full" onClick={() => window.print()}>Download / Print</Button>
            <Button variant="ghost" icon="trash2" className="w-full text-negative" onClick={() => setConfirmDel(true)}>Delete</Button>
          </Card>
        </div>
      </div>

      <SendInvoiceModal
        open={sendOpen}
        onClose={() => setSendOpen(false)}
        invoice={{
          id: invoice.id,
          number: invoice.number,
          currency: invoice.currency,
          total: invoice.total,
          dueDate: fmtDate(invoice.dueDate, locale),
          client: invoice.client,
        }}
      />

      <ConfirmDialog
        open={confirmDel}
        onClose={() => busy === null && setConfirmDel(false)}
        tone="danger"
        title="Delete invoice?"
        description={`${invoice.number} will be permanently removed.`}
        confirmLabel="Delete invoice"
        loading={busy === 'del'}
        onConfirm={() => run('del', async () => { await deleteInvoice(invoice.id); router.push('/invoices'); }, 'Invoice deleted')}
      />
    </div>
  );
}
