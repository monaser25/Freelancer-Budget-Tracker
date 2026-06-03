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

  const save = async (status: 'DRAFT' | 'SENT') => {
    const input = buildInput(status);
    if (input.lineItems.length === 0) {
      setError('Add at least one line item with a description.');
      return;
    }
    setError(null);
    setSaving(status === 'SENT' ? 'send' : 'draft');
    try {
      const result = invoice ? await updateInvoice(invoice.id, input) : await createInvoice(input);
      toast(invoice ? 'Invoice updated' : status === 'SENT' ? 'Invoice created & sent' : 'Draft saved');
      router.push(`/invoices/${result.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save invoice');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <IconButton icon="arrowLeft" title="Back" onClick={() => router.push('/invoices')} />
        <div>
          <h1 className="t-h1">{invoice ? `Edit ${invoice.number}` : 'New invoice'}</h1>
          <p className="t-body text-text-muted mt-0.5">Build the invoice; the preview updates live.</p>
        </div>
      </div>

      {error && <InlineAlert tone="negative" title="Couldn't save" body={error} />}

      <div className="fl-invoice-2pane grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Form */}
        <Card pad={20} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Client">
              <Select value={clientId} onChange={(e) => setClientId(e.target.value)}>
                <option value="">No client</option>
                {activeClients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </Field>
            <Field label="Currency">
              <Select value={currency} onChange={(e) => setCurrency(e.target.value as CurrencyCode)}>
                {supportedCurrencies.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Issue date"><Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} required /></Field>
            <Field label="Due date"><Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required /></Field>
          </div>

          {/* Line items */}
          <div>
            <div className="t-body-m text-text-secondary mb-2">Line items</div>
            <div className="flex flex-col gap-2">
              {lineItems.map((li, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Input
                    className="flex-1"
                    placeholder="Description"
                    value={li.description}
                    onChange={(e) => updateLine(i, { description: e.target.value })}
                  />
                  <Input
                    className="w-16"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="Qty"
                    value={li.quantity}
                    onChange={(e) => updateLine(i, { quantity: e.target.value })}
                  />
                  <Input
                    className="w-24"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Rate"
                    value={li.rate}
                    onChange={(e) => updateLine(i, { rate: e.target.value })}
                  />
                  <IconButton icon="x" size="sm" title="Remove line" onClick={() => removeLine(i)} className="mt-0.5" />
                </div>
              ))}
            </div>
            <button onClick={addLine} className="mt-2 inline-flex items-center gap-1.5 t-small font-medium text-accent hover:underline">
              <Icon name="plus" size={14} /> Add line item
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Tax rate (%)"><Input type="number" min="0" max="100" step="0.1" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} /></Field>
            <Field label="Discount"><Input type="number" min="0" step="0.01" value={discount} onChange={(e) => setDiscount(e.target.value)} /></Field>
          </div>

          <Field label="Notes"><Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional message to the client" /></Field>
          <Field label="Terms"><Textarea rows={2} value={terms} onChange={(e) => setTerms(e.target.value)} /></Field>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2 border-t border-border">
            <Button variant="secondary" loading={saving === 'draft'} disabled={!!saving} onClick={() => save('DRAFT')}>Save draft</Button>
            <Button icon="send" loading={saving === 'send'} disabled={!!saving} onClick={() => save('SENT')}>{invoice ? 'Save & mark sent' : 'Create & send'}</Button>
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
