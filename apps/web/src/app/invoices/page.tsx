'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useInvoiceStore } from '@/store/invoiceStore';
import { Invoice, InvoiceStatus } from '@/types/finance';
import { makeCurrencyFormatter } from '@/lib/currency';
import { formatDate } from '@/lib/format';
import { useLocale } from '@/lib/i18n';
import type { Locale } from '@/lib/locales';
import { Button, IconButton } from '@/components/ui/Button';
import { Card, StatCard } from '@/components/ui/Card';
import { Badge, FilterChip } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Menu } from '@/components/ui/Menu';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { InlineAlert } from '@/components/ui/InlineAlert';
import { SendInvoiceModal } from '@/components/invoices/SendInvoiceModal';

const STATUS_FILTERS: { id: 'all' | InvoiceStatus; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'DRAFT', label: 'Draft' },
  { id: 'SENT', label: 'Sent' },
  { id: 'PAID', label: 'Paid' },
  { id: 'OVERDUE', label: 'Overdue' },
];

const statusTone = (s: InvoiceStatus) =>
  s === 'PAID' ? 'positive' : s === 'OVERDUE' ? 'negative' : s === 'SENT' ? 'info' : 'neutral';

const fmtDate = (v: string, locale: Locale) => formatDate(v, locale, { month: 'short', day: 'numeric', year: 'numeric' });

export default function InvoicesPage() {
  const router = useRouter();
  const { locale } = useLocale();
  const { invoices, isLoaded, isLoading, error, loadInvoices, deleteInvoice, markPaid } = useInvoiceStore();
  const { toast } = useToast();
  const [filter, setFilter] = useState<'all' | InvoiceStatus>('all');
  const [deleting, setDeleting] = useState<Invoice | null>(null);
  const [sendTarget, setSendTarget] = useState<Invoice | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isLoaded) loadInvoices();
  }, [isLoaded, loadInvoices]);

  const summary = useMemo(() => {
    const now = new Date();
    let outstanding = 0;
    let overdue = 0;
    let paidThisMonth = 0;
    for (const inv of invoices) {
      if (inv.status === 'SENT') outstanding += inv.total;
      if (inv.status === 'OVERDUE') { outstanding += inv.total; overdue += inv.total; }
      if (inv.status === 'PAID' && inv.paidAt) {
        const d = new Date(inv.paidAt);
        if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) paidThisMonth += inv.total;
      }
    }
    return { outstanding, overdue, paidThisMonth };
  }, [invoices]);

  // Summary cards format in the most common currency among invoices (fallback USD).
  const baseCurrency = invoices[0]?.currency || 'USD';
  const money0 = useMemo(() => makeCurrencyFormatter(baseCurrency, { maximumFractionDigits: 0 }, locale), [baseCurrency, locale]);

  const filterCounts = useMemo(() => {
    const counts: Record<string, number> = { all: invoices.length };
    for (const f of STATUS_FILTERS) if (f.id !== 'all') counts[f.id] = invoices.filter((i) => i.status === f.id).length;
    return counts;
  }, [invoices]);

  const filtered = filter === 'all' ? invoices : invoices.filter((i) => i.status === filter);

  const onMarkPaid = async (inv: Invoice) => {
    setBusy(true);
    try {
      await markPaid(inv.id);
      toast(`${inv.number} marked as paid`);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed to mark paid', 'error');
    } finally {
      setBusy(false);
    }
  };

  const onSend = (inv: Invoice) => setSendTarget(inv);

  const confirmDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await deleteInvoice(deleting.id);
      toast(`${deleting.number} deleted`);
      setDeleting(null);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed to delete', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="t-h1">Invoices</h1>
          <p className="t-body text-text-muted mt-1">Bill clients and track payment</p>
        </div>
        <Button icon="plus" onClick={() => router.push('/invoices/new')}>New invoice</Button>
      </div>

      {error && <InlineAlert tone="negative" title="Couldn't load invoices" body={error} />}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Outstanding" value={money0.format(summary.outstanding)} icon="clock" />
        <StatCard label="Overdue" value={money0.format(summary.overdue)} tone={summary.overdue > 0 ? 'negative' : 'neutral'} icon="alertTriangle" />
        <StatCard label="Paid this month" value={money0.format(summary.paidThisMonth)} tone="positive" icon="checkCircle" />
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => (
          <FilterChip key={f.id} active={filter === f.id} count={filterCounts[f.id]} onClick={() => setFilter(f.id)}>
            {f.label}
          </FilterChip>
        ))}
      </div>

      <Card pad={0}>
        {isLoading && !isLoaded ? (
          <div className="p-5 flex flex-col gap-3">
            {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="fileText"
            title={invoices.length === 0 ? 'Create your first invoice' : 'No invoices in this view'}
            body={invoices.length === 0 ? 'Bill a client and track when they pay.' : 'Try a different filter.'}
            action={invoices.length === 0 ? <Button icon="plus" onClick={() => router.push('/invoices/new')}>New invoice</Button> : undefined}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <Th>Invoice</Th>
                  <Th>Client</Th>
                  <Th>Issued</Th>
                  <Th>Due</Th>
                  <Th>Status</Th>
                  <Th align="right">Amount</Th>
                  <Th align="right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((inv) => {
                  const money = makeCurrencyFormatter(inv.currency, { minimumFractionDigits: 2 }, locale);
                  return (
                    <tr
                      key={inv.id}
                      className="border-b border-border last:border-0 hover:bg-surface-hover transition-colors cursor-pointer"
                      onClick={() => router.push(`/invoices/${inv.id}`)}
                    >
                      <td className="px-4 py-3 t-body-m">{inv.number}</td>
                      <td className="px-4 py-3 text-text-secondary">{inv.client?.name || '—'}</td>
                      <td className="px-4 py-3 text-text-secondary tnum">{fmtDate(inv.issueDate, locale)}</td>
                      <td className={`px-4 py-3 tnum ${inv.status === 'OVERDUE' ? 'text-negative' : 'text-text-secondary'}`}>{fmtDate(inv.dueDate, locale)}</td>
                      <td className="px-4 py-3"><Badge tone={statusTone(inv.status)}>{inv.status[0] + inv.status.slice(1).toLowerCase()}</Badge></td>
                      <td className="px-4 py-3 text-right t-body-m tnum">{money.format(inv.total)}</td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end">
                          <Menu
                            align="right"
                            trigger={<IconButton icon="moreHorizontal" size="sm" title="Actions" />}
                            items={[
                              { icon: 'eye', label: 'View', onClick: () => router.push(`/invoices/${inv.id}`) },
                              { icon: 'pencil', label: 'Edit', onClick: () => router.push(`/invoices/${inv.id}/edit`), disabled: inv.status === 'PAID' },
                              ...(inv.status !== 'PAID' ? [{ icon: 'send', label: inv.status === 'SENT' ? 'Resend invoice' : 'Send invoice', onClick: () => onSend(inv) }] : []),
                              ...(inv.status !== 'PAID' ? [{ icon: 'checkCircle', label: 'Mark as paid', onClick: () => onMarkPaid(inv) }] : []),
                              { divider: true },
                              { icon: 'trash2', label: 'Delete', onClick: () => setDeleting(inv), danger: true },
                            ]}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => !busy && setDeleting(null)}
        tone="danger"
        title="Delete invoice?"
        description={deleting ? `${deleting.number} will be permanently removed.` : ''}
        confirmLabel="Delete invoice"
        loading={busy}
        onConfirm={confirmDelete}
      />

      {sendTarget && (
        <SendInvoiceModal
          open={!!sendTarget}
          onClose={() => setSendTarget(null)}
          invoice={{
            id: sendTarget.id,
            number: sendTarget.number,
            currency: sendTarget.currency,
            total: sendTarget.total,
            dueDate: fmtDate(sendTarget.dueDate, locale),
            client: sendTarget.client,
          }}
        />
      )}
    </div>
  );
}

function Th({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'right' }) {
  return (
    <th className={`px-4 py-3 t-caption text-text-muted ${align === 'right' ? 'text-right' : 'text-left'}`}>{children}</th>
  );
}
