'use client';

import { useMemo } from 'react';
import { makeCurrencyFormatter } from '@/lib/currency';
import { formatDate } from '@/lib/format';
import { useLocale } from '@/lib/i18n';
import type { Locale } from '@/lib/locales';
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

const fmtDate = (v: string, locale: Locale) => {
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? '—' : formatDate(d, locale, { month: 'short', day: 'numeric', year: 'numeric' });
};

export function InvoiceDocument({ data }: { data: InvoiceDocData }) {
  const { t, locale } = useLocale();
  const money = useMemo(() => makeCurrencyFormatter(data.currency, { minimumFractionDigits: 2 }, locale), [data.currency, locale]);

  const items = data.lineItems.map((li) => ({ ...li, amount: (Number(li.quantity) || 0) * (Number(li.rate) || 0) }));
  const subtotal = items.reduce((s, li) => s + li.amount, 0);
  const discounted = Math.max(0, subtotal - (Number(data.discount) || 0));
  const taxAmount = discounted * ((Number(data.taxRate) || 0) / 100);
  const total = discounted + taxAmount;

  return (
    <div className="bg-surface text-text rounded-lg border border-border overflow-hidden" id="invoice-document" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <div className="p-7 sm:p-9">
        {/* Header */}
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-[10px] bg-accent flex items-center justify-center">
              <Icon name="wallet" size={20} className="text-white" />
            </div>
            <div>
              <div className="t-h3 leading-tight">{data.fromName || t('topbar.copy.fallback.title')}</div>
              {data.fromEmail && <div className="t-small text-text-muted" dir="ltr">{data.fromEmail}</div>}
            </div>
          </div>
          <div className="text-right" style={{ textAlign: locale === 'ar' ? 'left' : 'right' }}>
            <div className="t-h1">{t('invoices.doc.title')}</div>
            <div className="t-body-m text-text-secondary tnum" dir="ltr">{data.number || '—'}</div>
          </div>
        </div>

        {/* Meta */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 mt-8">
          <div>
            <div className="t-caption text-text-muted mb-1">{t('invoices.doc.billedTo')}</div>
            <div className="t-body-m" dir="ltr" style={{ textAlign: locale === 'ar' ? 'right' : 'left' }}>{data.clientName || '—'}</div>
            {data.clientCompany && <div className="t-small text-text-secondary" dir="ltr" style={{ textAlign: locale === 'ar' ? 'right' : 'left' }}>{data.clientCompany}</div>}
            {data.clientEmail && <div className="t-small text-text-muted" dir="ltr" style={{ textAlign: locale === 'ar' ? 'right' : 'left' }}>{data.clientEmail}</div>}
          </div>
          <div>
            <div className="t-caption text-text-muted mb-1">{t('invoices.doc.issued')}</div>
            <div className="t-body-m tnum" dir="ltr" style={{ textAlign: locale === 'ar' ? 'right' : 'left' }}>{fmtDate(data.issueDate, locale)}</div>
          </div>
          <div>
            <div className="t-caption text-text-muted mb-1">{t('invoices.doc.due')}</div>
            <div className="t-body-m tnum" dir="ltr" style={{ textAlign: locale === 'ar' ? 'right' : 'left' }}>{fmtDate(data.dueDate, locale)}</div>
          </div>
        </div>

        {/* Line items */}
        <table className="w-full mt-8 border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="t-caption text-text-muted py-2" style={{ textAlign: locale === 'ar' ? 'right' : 'left' }}>{t('invoices.doc.description')}</th>
              <th className="t-caption text-text-muted py-2 w-16" style={{ textAlign: locale === 'ar' ? 'left' : 'right' }}>{t('invoices.doc.qty')}</th>
              <th className="t-caption text-text-muted py-2 w-28" style={{ textAlign: locale === 'ar' ? 'left' : 'right' }}>{t('invoices.doc.rate')}</th>
              <th className="t-caption text-text-muted py-2 w-28" style={{ textAlign: locale === 'ar' ? 'left' : 'right' }}>{t('invoices.doc.amount')}</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td colSpan={4} className="py-6 text-center t-small text-text-muted">{t('invoices.doc.noLineItems')}</td></tr>
            ) : (
              items.map((li, i) => (
                <tr key={i} className="border-b border-border">
                  <td className="py-2.5 t-body">{li.description || <span className="text-text-muted">{t('invoices.doc.itemDescription')}</span>}</td>
                  <td className="py-2.5 t-body tnum" style={{ textAlign: locale === 'ar' ? 'left' : 'right' }} dir="ltr">{li.quantity}</td>
                  <td className="py-2.5 t-body tnum" style={{ textAlign: locale === 'ar' ? 'left' : 'right' }} dir="ltr">{money.format(li.rate)}</td>
                  <td className="py-2.5 t-body-m tnum" style={{ textAlign: locale === 'ar' ? 'left' : 'right' }} dir="ltr">{money.format(li.amount)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex mt-5" style={{ justifyContent: locale === 'ar' ? 'flex-start' : 'flex-end' }}>
          <div className="w-full sm:w-[280px] flex flex-col gap-2">
            <Row label={t('invoices.doc.subtotal')} value={money.format(subtotal)} />
            {Number(data.discount) > 0 && <Row label={t('invoices.doc.discount')} value={`−${money.format(Number(data.discount))}`} />}
            {Number(data.taxRate) > 0 && <Row label={t('invoices.doc.tax').replace('{rate}', String(data.taxRate))} value={money.format(taxAmount)} />}
            <div className="h-px bg-border my-1" />
            <div className="flex items-center justify-between">
              <span className="t-h3">{t('invoices.doc.total')}</span>
              <span className="t-h3 tnum" dir="ltr">{money.format(total)}</span>
            </div>
          </div>
        </div>

        {(data.notes || data.terms) && (
          <div className="mt-8 pt-5 border-t border-border flex flex-col gap-3">
            {data.notes && <div><div className="t-caption text-text-muted mb-1">{t('invoices.doc.notes')}</div><div className="t-small text-text-secondary whitespace-pre-wrap">{data.notes}</div></div>}
            {data.terms && <div><div className="t-caption text-text-muted mb-1">{t('invoices.doc.terms')}</div><div className="t-small text-text-secondary whitespace-pre-wrap">{data.terms}</div></div>}
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
      <span className="t-body tnum" dir="ltr">{value}</span>
    </div>
  );
}
