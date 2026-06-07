'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFinancialStore } from '@/store/financialStore';
import { useInvoiceStore } from '@/store/invoiceStore';
import { useToast } from '@/components/ui/Toast';
import { Invoice, CurrencyCode } from '@/types/finance';
import { supportedCurrencies } from '@/lib/currency';
import { type InvoiceInput } from '@/services/financialApi';
import { Button, IconButton } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Field, Input, Select, Textarea } from '@/components/ui/Form';
import { Icon } from '@/components/ui/Icon';
import { InlineAlert } from '@/components/ui/InlineAlert';
import { InvoiceDocument } from '@/components/invoices/InvoiceDocument';
import { useLocale } from '@/lib/i18n';

const today = () => new Date().toISOString().slice(0, 10);
const plusDays = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

type LineRow = { description: string; quantity: string; rate: string };

export function InvoiceEditor({ invoice }: { invoice?: Invoice }) {
  const router = useRouter();
  const { clients, currency: defaultCurrency } = useFinancialStore();
  const { createInvoice, updateInvoice } = useInvoiceStore();
  const { toast } = useToast();
  const { t } = useLocale();

  const [clientId, setClientId] = useState(invoice?.clientId || '');
  const [issueDate, setIssueDate] = useState(invoice?.issueDate?.slice(0, 10) || today());
  const [dueDate, setDueDate] = useState(invoice?.dueDate?.slice(0, 10) || plusDays(14));
  const [currency, setCurrency] = useState<CurrencyCode>((invoice?.currency as CurrencyCode) || defaultCurrency);
  const [taxRate, setTaxRate] = useState(String(invoice?.taxRate ?? 0));
  const [discount, setDiscount] = useState(String(invoice?.discount ?? 0));
  const [notes, setNotes] = useState(invoice?.notes || '');
  const [terms, setTerms] = useState(invoice?.terms || 'Payment due within 14 days.');
  const [lineItems, setLineItems] = useState<LineRow[]>(
    invoice?.lineItems?.length
      ? invoice.lineItems.map((li) => ({ description: li.description, quantity: String(li.quantity), rate: String(li.rate) }))
      : [{ description: '', quantity: '1', rate: '' }],
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<false | 'draft' | 'send'>(false);

  const activeClients = useMemo(() => clients.filter((c) => !c.archivedAt), [clients]);
  const selectedClient = activeClients.find((c) => c.id === clientId);

  const updateLine = (i: number, patch: Partial<LineRow>) =>
    setLineItems((rows) => rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const addLine = () => setLineItems((rows) => [...rows, { description: '', quantity: '1', rate: '' }]);
  const removeLine = (i: number) => setLineItems((rows) => (rows.length > 1 ? rows.filter((_, idx) => idx !== i) : rows));

  const docData = {
    number: invoice?.number || 'Draft',
    issueDate,
    dueDate,
    currency,
    clientName: selectedClient?.name,
    clientCompany: selectedClient?.company,
    clientEmail: selectedClient?.email,
    lineItems: lineItems.map((li) => ({ description: li.description, quantity: Number(li.quantity) || 0, rate: Number(li.rate) || 0 })),
    taxRate: Number(taxRate) || 0,
    discount: Number(discount) || 0,
    notes,
    terms,
  };

  const buildInput = (status: 'DRAFT' | 'SENT'): InvoiceInput => ({
    number: invoice?.number,
    clientId: clientId || null,
    issueDate,
    dueDate,
    status,
    currency,
    taxRate: Number(taxRate) || 0,
    discount: Number(discount) || 0,
    notes: notes || undefined,
    terms: terms || undefined,
    lineItems: lineItems
      .filter((li) => li.description.trim())
      .map((li) => ({ description: li.description.trim(), quantity: Number(li.quantity) || 0, rate: Number(li.rate) || 0 })),
  });

  const save = async (intent: 'draft' | 'send') => {
    // An invoice is never persisted as SENT here — it becomes SENT only after a
    // successful email send. New invoices save as DRAFT; edits keep their current
    // status. "Create & send" saves first, then opens the Send modal (?send=1).
    const input = buildInput((invoice?.status as 'DRAFT' | 'SENT') ?? 'DRAFT');
    if (input.lineItems.length === 0) {
      setError(t('invoices.editor.errorNoLineItems'));
      return;
    }
    setError(null);
    setSaving(intent === 'send' ? 'send' : 'draft');
    try {
      const result = invoice ? await updateInvoice(invoice.id, input) : await createInvoice(input);
      toast(invoice ? t('invoices.editor.toastUpdated') : t('invoices.editor.toastSaved'));
      router.push(intent === 'send' ? `/invoices/${result.id}?send=1` : `/invoices/${result.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('invoices.editor.errorFailedSave'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <IconButton icon="arrowLeft" title={t('invoices.editor.back')} onClick={() => router.push('/invoices')} />
        <div>
          <h1 className="t-h1" dir="auto">{invoice ? t('invoices.editor.editTitle').replace('{number}', invoice.number) : t('invoices.editor.newTitle')}</h1>
          <p className="t-body text-text-muted mt-0.5">{t('invoices.editor.subtitle')}</p>
        </div>
      </div>

      {error && <InlineAlert tone="negative" title={t('invoices.editor.errorSave')} body={error} />}

      <div className="fl-invoice-2pane grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Form */}
        <Card pad={20} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label={t('invoices.editor.clientLabel')}>
              <Select value={clientId} onChange={(e) => setClientId(e.target.value)}>
                <option value="">{t('invoices.editor.noClient')}</option>
                {activeClients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </Field>
            <Field label={t('invoices.editor.currencyLabel')}>
              <Select value={currency} onChange={(e) => setCurrency(e.target.value as CurrencyCode)} dir="ltr">
                {supportedCurrencies.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label={t('invoices.editor.issueDateLabel')}><Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} required /></Field>
            <Field label={t('invoices.editor.dueDateLabel')}><Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required /></Field>
          </div>

          {/* Line items */}
          <div>
            <div className="t-body-m text-text-secondary mb-2">{t('invoices.editor.lineItemsLabel')}</div>
            <div className="flex flex-col gap-2">
              {lineItems.map((li, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Input
                    className="flex-1"
                    placeholder={t('invoices.editor.descriptionPlaceholder')}
                    value={li.description}
                    onChange={(e) => updateLine(i, { description: e.target.value })}
                  />
                  <Input
                    className="w-16"
                    type="number"
                    min="0"
                    step="1"
                    placeholder={t('invoices.editor.qtyPlaceholder')}
                    value={li.quantity}
                    onChange={(e) => updateLine(i, { quantity: e.target.value })}
                  />
                  <Input
                    className="w-24"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder={t('invoices.editor.ratePlaceholder')}
                    value={li.rate}
                    onChange={(e) => updateLine(i, { rate: e.target.value })}
                  />
                  <IconButton icon="x" size="sm" title={t('invoices.editor.removeLine')} onClick={() => removeLine(i)} className="mt-0.5" />
                </div>
              ))}
            </div>
            <button onClick={addLine} className="mt-2 inline-flex items-center gap-1.5 t-small font-medium text-accent hover:underline">
              <Icon name="plus" size={14} /> {t('invoices.editor.addLine')}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label={t('invoices.editor.taxRateLabel')}><Input type="number" min="0" max="100" step="0.1" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} /></Field>
            <Field label={t('invoices.editor.discountLabel')}><Input type="number" min="0" step="0.01" value={discount} onChange={(e) => setDiscount(e.target.value)} /></Field>
          </div>

          <Field label={t('invoices.editor.notesLabel')}><Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t('invoices.editor.notesPlaceholder')} /></Field>
          <Field label={t('invoices.editor.termsLabel')}><Textarea rows={2} value={terms} onChange={(e) => setTerms(e.target.value)} /></Field>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2 border-t border-border">
            <Button variant="secondary" loading={saving === 'draft'} disabled={!!saving} onClick={() => save('draft')}>{t('invoices.editor.saveDraft')}</Button>
            <Button icon="send" loading={saving === 'send'} disabled={!!saving} onClick={() => save('send')}>{invoice ? t('invoices.editor.saveAndSend') : t('invoices.editor.createAndSend')}</Button>
          </div>
        </Card>

        {/* Live preview */}
        <div className="lg:sticky lg:top-[84px]">
          <InvoiceDocument data={docData} />
        </div>
      </div>
    </div>
  );
}

