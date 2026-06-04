'use client';

import { useMemo } from 'react';
import { makeCurrencyFormatter } from '@/lib/currency';
import { CurrencyCode } from '@/types/finance';
import { Icon } from '@/components/ui/Icon';

export interface InvoiceDocData {
  number: string;
  issueDate: string;
  dueDate: string;
  currency: CurrencyCode;
  status?: string;
  clientName?: string;
  clientCompany?: string | null;
  clientEmail?: string | null;
  fromName?: string;
  fromEmail?: string;
  lineItems: { description: string; quantity: number; rate: number }[];
  taxRate: number;
  discount: number;
  notes?: string | null;
  terms?: string | null;
}

const fmtDate = (v: string) => {
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export function InvoiceDocument({ data }: { data: InvoiceDocData }) {
  const money = useMemo(() => makeCurrencyFormatter(data.currency, { minimumFractionDigits: 2 }), [data.currency]);

  const items = data.lineItems.map((li) => ({ ...li, amount: (Number(li.quantity) || 0) * (Number(li.rate) || 0) }));
  const subtotal = items.reduce((s, li) => s + li.amount, 0);
  const discounted = Math.max(0, subtotal - (Number(data.discount) || 0));
  const taxAmount = discounted * ((Number(data.taxRate) || 0) / 100);
  const total = discounted + taxAmount;

  return (
    <div className="bg-surface text-text rounded-lg border border-border overflow-hidden" id="invoice-document">
      <div className="p-7 sm:p-9">
        {/* Header */}
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-[10px] bg-accent flex items-center justify-center">
              <Icon name="wallet" size={20} className="text-white" />
            </div>
            <div>
              <div className="t-h3 leading-tight">{data.fromName || 'Haseeela'}</div>
              {data.fromEmail && <div className="t-small text-text-muted">{data.fromEmail}</div>}
            </div>
          </div>
          <div className="text-right">
            <div className="t-h1">Invoice</div>
            <div className="t-body-m text-text-secondary tnum">{data.number || '—'}</div>
          </div>
        </div>

        {/* Meta */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 mt-8">
          <div>
            <div className="t-caption text-text-muted mb-1">Billed to</div>
            <div className="t-body-m">{data.clientName || '—'}</div>
            {data.clientCompany && <div className="t-small text-text-secondary">{data.clientCompany}</div>}
            {data.clientEmail && <div className="t-small text-text-muted">{data.clientEmail}</div>}
          </div>
          <div>
            <div className="t-caption text-text-muted mb-1">Issued</div>
            <div className="t-body-m tnum">{fmtDate(data.issueDate)}</div>
          </div>
          <div>
            <div className="t-caption text-text-muted mb-1">Due</div>
            <div className="t-body-m tnum">{fmtDate(data.dueDate)}</div>
          </div>
        </div>

        {/* Line items */}
        <table className="w-full mt-8 border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left t-caption text-text-muted py-2">Description</th>
              <th className="text-right t-caption text-text-muted py-2 w-16">Qty</th>
              <th className="text-right t-caption text-text-muted py-2 w-28">Rate</th>
              <th className="text-right t-caption text-text-muted py-2 w-28">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td colSpan={4} className="py-6 text-center t-small text-text-muted">No line items yet</td></tr>
            ) : (
              items.map((li, i) => (
                <tr key={i} className="border-b border-border">
                  <td className="py-2.5 t-body">{li.description || <span className="text-text-muted">Item description</span>}</td>
                  <td className="py-2.5 text-right t-body tnum">{li.quantity}</td>
                  <td className="py-2.5 text-right t-body tnum">{money.format(li.rate)}</td>
                  <td className="py-2.5 text-right t-body-m tnum">{money.format(li.amount)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end mt-5">
          <div className="w-full sm:w-[280px] flex flex-col gap-2">
            <Row label="Subtotal" value={money.format(subtotal)} />
            {Number(data.discount) > 0 && <Row label="Discount" value={`−${money.format(Number(data.discount))}`} />}
            {Number(data.taxRate) > 0 && <Row label={`Tax (${data.taxRate}%)`} value={money.format(taxAmount)} />}
            <div className="h-px bg-border my-1" />
            <div className="flex items-center justify-between">
              <span className="t-h3">Total</span>
              <span className="t-h3 tnum">{money.format(total)}</span>
            </div>
          </div>
        </div>

        {(data.notes || data.terms) && (
          <div className="mt-8 pt-5 border-t border-border flex flex-col gap-3">
            {data.notes && <div><div className="t-caption text-text-muted mb-1">Notes</div><div className="t-small text-text-secondary whitespace-pre-wrap">{data.notes}</div></div>}
            {data.terms && <div><div className="t-caption text-text-muted mb-1">Terms</div><div className="t-small text-text-secondary whitespace-pre-wrap">{data.terms}</div></div>}
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="t-small text-text-secondary">{label}</span>
      <span className="t-body tnum">{value}</span>
    </div>
  );
}
