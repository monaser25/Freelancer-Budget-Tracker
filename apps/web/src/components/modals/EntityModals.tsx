'use client';

import { useMemo, useState } from 'react';
import { useFinancialStore } from '@/store/financialStore';
import { computeNextBillingDate } from '@/store/financialStore';
import { useUiStore } from '@/store/uiStore';
import { Client, Subscription, Transaction } from '@/types/finance';
import { makeCurrencyFormatter } from '@/lib/currency';
import { useLocale } from '@/lib/i18n';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select, Textarea, Segmented } from '@/components/ui/Form';
import { useToast } from '@/components/ui/Toast';

const today = () => new Date().toISOString().slice(0, 10);
const makeId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const toIsoDate = (date: string) => new Date(`${date}T12:00:00`).toISOString();

/**
 * Global "New …" modal host. Driven by the UI store so the topbar "+ New"
 * dropdown, the command palette, and the sidebar can all open the same forms
 * from anywhere in the app.
 */
export function EntityModals() {
  const { newModal, closeNewModal } = useUiStore();
  const { addTransaction, addClient, addSubscription, currency } = useFinancialStore();
  const { locale } = useLocale();
  const { toast } = useToast();

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const money = useMemo(() => makeCurrencyFormatter(currency, { minimumFractionDigits: 2 }, locale), [currency, locale]);
  const currencyPrefix = useMemo(
    () => money.formatToParts(0).find((p) => p.type === 'currency')?.value || currency,
    [currency, money],
  );

  const close = () => {
    if (isSaving) return;
    setError(null);
    closeNewModal();
  };

  const isTx = newModal === 'income' || newModal === 'expense';
  const txType: 'INCOME' | 'EXPENSE' = newModal === 'expense' ? 'EXPENSE' : 'INCOME';

  const saveTransaction = async (form: FormData) => {
    const amount = Number(form.get('amount'));
    const name = String(form.get('name') || '').trim();
    if (!name || !amount || amount <= 0) {
      setError('Name and a positive amount are required.');
      return;
    }
    const tx: Transaction = {
      id: makeId(),
      name,
      amount,
      type: txType,
      status: 'COMPLETED',
      date: toIsoDate(String(form.get('date') || today())),
      notes: String(form.get('notes') || '').trim(),
      sourceType: 'manual',
      categoryId: String(form.get('categoryId') || (txType === 'INCOME' ? 'CLIENT' : 'TOOLS')),
    };
    setIsSaving(true);
    setError(null);
    try {
      await addTransaction(tx);
      toast(txType === 'INCOME' ? 'Revenue added' : 'Expense logged');
      closeNewModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save transaction');
    } finally {
      setIsSaving(false);
    }
  };

  const saveClient = async (form: FormData, paymentType: Client['paymentType']) => {
    const name = String(form.get('name') || '').trim();
    const revenue = Number(form.get('revenue') || 0);
    if (!name || revenue <= 0) {
      setError('Name and a positive amount are required.');
      return;
    }
    const nextBillingDate =
      paymentType === 'retainer'
        ? String(form.get('nextBillingDate') || computeNextBillingDate(new Date().getDate()))
        : undefined;
    setIsSaving(true);
    setError(null);
    try {
      await addClient({
        id: makeId(),
        name,
        company: String(form.get('company') || '').trim(),
        email: String(form.get('email') || '').trim(),
        revenue,
        clientType: String(form.get('clientType') || 'COMPANY') as Client['clientType'],
        status: 'ACTIVE',
        paymentType,
        paymentDate: paymentType === 'onetime' ? String(form.get('paymentDate') || today()) : undefined,
        billingDay: nextBillingDate
          ? Math.max(1, Math.min(28, new Date(`${nextBillingDate}T12:00:00`).getDate()))
          : undefined,
        nextBillingDate,
        recorded: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      toast('Client added');
      closeNewModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create client');
    } finally {
      setIsSaving(false);
    }
  };

  const saveSubscription = async (form: FormData) => {
    const name = String(form.get('name') || '').trim();
    const amount = Number(form.get('amount') || 0);
    const cycle = String(form.get('billingCycle') || 'MONTHLY') as Subscription['cycle'];
    const nextBillingDate = String(form.get('nextBillingDate') || computeNextBillingDate(new Date().getDate()));
    if (!name || amount <= 0) {
      setError('Name and a positive amount are required.');
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      await addSubscription({
        id: makeId(),
        name,
        amount,
        cycle,
        billingCycle: cycle,
        notes: String(form.get('notes') || '').trim(),
        billingDay: Math.max(1, Math.min(28, new Date(`${nextBillingDate}T12:00:00`).getDate())),
        nextBillingDate,
        status: 'ACTIVE',
      });
      toast('Subscription added');
      closeNewModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create subscription');
    } finally {
      setIsSaving(false);
    }
  };

  if (!newModal) return null;

  if (isTx) {
    return (
      <Modal
        open
        onClose={close}
        dismissable={!isSaving}
        title={txType === 'INCOME' ? 'Add revenue' : 'Log expense'}
        description={
          txType === 'INCOME' ? 'Record a client payment or project win.' : 'Record a tool, tax, or operating cost.'
        }
      >
        <TransactionForm type={txType} prefix={currencyPrefix} error={error} saving={isSaving} onCancel={close} onSave={saveTransaction} />
      </Modal>
    );
  }
  if (newModal === 'client') {
    return (
      <Modal open onClose={close} dismissable={!isSaving} title="Add client" description="Create a one-time client or monthly retainer." maxWidth={520}>
        <ClientForm prefix={currencyPrefix} error={error} saving={isSaving} onCancel={close} onSave={saveClient} />
      </Modal>
    );
  }
  return (
    <Modal open onClose={close} dismissable={!isSaving} title="Add subscription" description="Track a recurring software or service cost.">
      <SubscriptionForm prefix={currencyPrefix} error={error} saving={isSaving} onCancel={close} onSave={saveSubscription} />
    </Modal>
  );
}

const INCOME_CATEGORIES = [
  { value: 'CLIENT', label: 'Client Payment' },
  { value: 'PROJECT', label: 'Project Revenue' },
  { value: 'OTHER', label: 'Other Income' },
];
const EXPENSE_CATEGORIES = [
  { value: 'TOOLS', label: 'Tools' },
  { value: 'OPERATIONS', label: 'Operations' },
  { value: 'TAXES', label: 'Taxes' },
  { value: 'OTHER', label: 'Other Expense' },
];

function TransactionForm({
  type,
  prefix,
  error,
  saving,
  onCancel,
  onSave,
}: {
  type: 'INCOME' | 'EXPENSE';
  prefix: string;
  error: string | null;
  saving: boolean;
  onCancel: () => void;
  onSave: (form: FormData) => void;
}) {
  const cats = type === 'INCOME' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(new FormData(e.currentTarget)); }} className="flex flex-col gap-4">
      {error && <p className="t-small text-negative">{error}</p>}
      <Field label="Transaction name">
        <Input name="name" placeholder={type === 'INCOME' ? 'Website design project' : 'Adobe Creative Cloud'} required autoFocus />
      </Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Amount"><Input name="amount" type="number" min="0" step="0.01" required prefix={prefix} /></Field>
        <Field label="Date"><Input name="date" type="date" defaultValue={today()} required /></Field>
      </div>
      <Field label="Category">
        <Select name="categoryId">
          {cats.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </Select>
      </Field>
      <Field label="Notes"><Input name="notes" placeholder="Optional details" /></Field>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" disabled={saving} onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={saving}>Save entry</Button>
      </div>
    </form>
  );
}

function ClientForm({
  prefix,
  error,
  saving,
  onCancel,
  onSave,
}: {
  prefix: string;
  error: string | null;
  saving: boolean;
  onCancel: () => void;
  onSave: (form: FormData, paymentType: Client['paymentType']) => void;
}) {
  const [paymentType, setPaymentType] = useState<Client['paymentType']>('onetime');
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(new FormData(e.currentTarget), paymentType); }} className="flex flex-col gap-4">
      {error && <p className="t-small text-negative">{error}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Client name"><Input name="name" required autoFocus /></Field>
        <Field label="Amount"><Input name="revenue" type="number" min="0" step="0.01" required prefix={prefix} /></Field>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Company"><Input name="company" /></Field>
        <Field label="Email"><Input name="email" type="email" /></Field>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Client type">
          <Select name="clientType" defaultValue="COMPANY">
            <option value="COMPANY">Company</option>
            <option value="INDIVIDUAL">Individual</option>
          </Select>
        </Field>
        <Field label="Payment type">
          <Select name="paymentType" value={paymentType} onChange={(e) => setPaymentType(e.target.value as Client['paymentType'])}>
            <option value="onetime">One-time payment</option>
            <option value="retainer">Monthly retainer</option>
          </Select>
        </Field>
      </div>
      {paymentType === 'retainer' ? (
        <Field label="Next billing date"><Input name="nextBillingDate" type="date" defaultValue={computeNextBillingDate(new Date().getDate())} required /></Field>
      ) : (
        <Field label="Payment date"><Input name="paymentDate" type="date" defaultValue={today()} required /></Field>
      )}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" disabled={saving} onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={saving}>Save client</Button>
      </div>
    </form>
  );
}

function SubscriptionForm({
  prefix,
  error,
  saving,
  onCancel,
  onSave,
}: {
  prefix: string;
  error: string | null;
  saving: boolean;
  onCancel: () => void;
  onSave: (form: FormData) => void;
}) {
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(new FormData(e.currentTarget)); }} className="flex flex-col gap-4">
      {error && <p className="t-small text-negative">{error}</p>}
      <Field label="Service name"><Input name="name" placeholder="Vercel Pro" required autoFocus /></Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Cost"><Input name="amount" type="number" min="0" step="0.01" required prefix={prefix} /></Field>
        <Field label="Next billing date"><Input name="nextBillingDate" type="date" defaultValue={computeNextBillingDate(new Date().getDate())} required /></Field>
      </div>
      <Field label="Billing cycle">
        <Select name="billingCycle" defaultValue="MONTHLY">
          <option value="MONTHLY">Monthly</option>
          <option value="QUARTERLY">Quarterly</option>
          <option value="YEARLY">Yearly</option>
        </Select>
      </Field>
      <Field label="Notes"><Textarea name="notes" placeholder="Optional" rows={2} /></Field>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" disabled={saving} onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={saving}>Save subscription</Button>
      </div>
    </form>
  );
}
