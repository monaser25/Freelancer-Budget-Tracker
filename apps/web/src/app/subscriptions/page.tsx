'use client';

import { useEffect, useMemo, useState } from 'react';
import { computeNextBillingDate } from '@/store/financialStore';
import { useFinancialStore } from '@/store/useFinancialStore';
import { Subscription } from '@/types/finance';
import { makeCurrencyFormatter } from '@/lib/currency';
import { CreditCard, DollarSign, Info, Pencil, Plus, Trash2 } from 'lucide-react';

type ModalState = { mode: 'add' } | { mode: 'edit'; subscription: Subscription } | null;
type DeleteTarget = { subscription: Subscription; pastCount: number } | null;

const inputClass = 'w-full px-3 py-2 border border-border rounded-md text-[13px] outline-none focus:border-accent bg-background';
const today = () => new Date().toISOString().slice(0, 10);

const makeId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const monthlyEquivalent = (subscription: Subscription) => {
  const cycle = subscription.billingCycle || subscription.cycle;
  if (cycle === 'YEARLY') return subscription.amount / 12;
  if (cycle === 'QUARTERLY') return subscription.amount / 3;
  return subscription.amount;
};

export default function SubscriptionsPage() {
  const { subscriptions, transactions, currency, isInitialized, addSubscription, updateSubscription, deleteSubscription, recordSubscriptionPayment } = useFinancialStore();
  const [modal, setModal] = useState<ModalState>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [recordingId, setRecordingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const money = useMemo(() => makeCurrencyFormatter(currency), [currency]);

  useEffect(() => {
    if (!isInitialized) return;
    const action = new URLSearchParams(window.location.search).get('action');
    if (action === 'tool' || action === 'run') {
      setModalError(null);
      setModal({ mode: 'add' });
      window.history.replaceState(null, '', '/subscriptions');
    }
  }, [isInitialized]);

  const visibleSubscriptions = useMemo(
    () => subscriptions.filter((sub) => showArchived || !sub.archivedAt),
    [showArchived, subscriptions],
  );
  const totalMonthlyCost = useMemo(() => visibleSubscriptions.filter((sub) => sub.status === 'ACTIVE' && !sub.archivedAt).reduce((sum, sub) => sum + monthlyEquivalent(sub), 0), [visibleSubscriptions]);

  const saveSubscription = async (formData: FormData, existing?: Subscription) => {
    const name = String(formData.get('name') || '').trim();
    const amount = Number(formData.get('amount'));
    const billingCycle = String(formData.get('billingCycle') || 'MONTHLY') as Subscription['cycle'];
    const notes = String(formData.get('notes') || '').trim();
    const status = String(formData.get('status') || 'ACTIVE') as Subscription['status'];
    const nextBillingDate = String(formData.get('nextBillingDate') || '');
    const billingDay = nextBillingDate
      ? Math.max(1, Math.min(28, new Date(`${nextBillingDate}T12:00:00`).getDate()))
      : 1;

    if (!name || amount <= 0 || !nextBillingDate) return;

    const payload = {
      name,
      amount,
      cycle: billingCycle,
      billingCycle,
      notes,
      billingDay,
      nextBillingDate,
      status,
    };

    setIsSaving(true);
    setModalError(null);
    try {
      if (existing) await updateSubscription(existing.id, payload);
      else await addSubscription({ id: makeId(), ...payload });
      setModal(null);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Failed to save subscription');
    } finally {
      setIsSaving(false);
    }
  };

  const requestDelete = (subscription: Subscription) => {
    const t = today();
    const pastCount = transactions.filter(
      (tx) => (tx.subscriptionId === subscription.id || (tx.sourceType === 'subscription' && tx.sourceId === subscription.id)) && tx.date.slice(0, 10) <= t,
    ).length;
    setDeleteError(null);
    setDeleteTarget({ subscription, pastCount });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteSubscription(deleteTarget.subscription.id);
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete subscription');
    } finally {
      setIsDeleting(false);
    }
  };

  const closeDeleteModal = () => { if (!isDeleting) setDeleteTarget(null); };

  const recordPayment = async (subscription: Subscription) => {
    setRecordingId(subscription.id);
    setActionError(null);
    try {
      await recordSubscriptionPayment(subscription.id);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to record subscription payment');
    } finally {
      setRecordingId(null);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="bg-card border border-border rounded-[var(--radius-lg)] overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-border flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-[14px] font-semibold text-textPrimary">Tool Subscriptions</h1>
              <p className="text-[12px] text-textMuted mt-1">Software and services that generate recurring expenses</p>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
              <label className="inline-flex items-center gap-2 text-[12px] text-textSecondary">
                <input type="checkbox" checked={showArchived} onChange={(event) => setShowArchived(event.target.checked)} />
                Show archived
              </label>
              <button type="button" onClick={() => { setModalError(null); setModal({ mode: 'add' }); }} className="inline-flex w-full items-center justify-center gap-2 px-3 py-2 rounded-md bg-accent text-white text-[13px] font-medium hover:bg-accent-hover sm:w-auto">
                <Plus size={15} /> Add Subscription
              </button>
            </div>
          </div>
          {actionError && <div className="mx-4 mt-4 rounded-md bg-red-50 border border-red-100 px-3 py-2 text-[13px] text-red-600 sm:mx-5">{actionError}</div>}

          {visibleSubscriptions.length === 0 ? (
            <div className="text-center py-10 text-textMuted">
              <div className="flex justify-center mb-3 text-slate-300"><CreditCard size={34} /></div>
              <p className="text-[13px]">No tool subscriptions yet. Add recurring software costs here.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {visibleSubscriptions.map((sub) => (
                <div key={sub.id} className="p-4 flex flex-col gap-4 hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3 sm:items-center">
                    <div className="w-9 h-9 rounded-md bg-blue-50 text-accent flex items-center justify-center">
                      <CreditCard size={18} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[13.5px] font-medium text-textPrimary">{sub.name}</div>
                      <div className="text-[12px] text-textMuted">
                        {(sub.billingCycle || sub.cycle).toLowerCase()} - next {new Date(sub.nextBillingDate).toLocaleDateString()}
                        {sub.notes ? ` - ${sub.notes}` : ''}
                        {sub.archivedAt ? ' - archived' : ''}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <div className="text-left sm:text-right">
                      <div className="text-[14px] font-mono font-semibold text-textPrimary">{money.format(monthlyEquivalent(sub))}/mo</div>
                      <div className="text-[11px] text-textMuted">{money.format(sub.amount)} billed</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {sub.status === 'ACTIVE' && !sub.archivedAt && (
                        <button type="button" disabled={recordingId === sub.id} onClick={() => recordPayment(sub)} className="text-green-600 hover:text-green-700 p-1 inline-flex disabled:opacity-60" aria-label={`Record payment for ${sub.name}`}>
                          <DollarSign size={15} />
                        </button>
                      )}
                      <button type="button" onClick={() => { setModalError(null); setModal({ mode: 'edit', subscription: sub }); }} className="text-textSecondary hover:text-accent p-1 inline-flex" aria-label={`Edit ${sub.name}`}>
                        <Pencil size={15} />
                      </button>
                      <button type="button" onClick={() => requestDelete(sub)} className="text-red-500 hover:text-red-700 p-1 inline-flex" aria-label={`Delete ${sub.name}`}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card border border-border rounded-[var(--radius-lg)] p-4 sm:p-5 max-w-md">
          <div className="text-[12px] text-textMuted">Total Monthly Cost</div>
          <div className="text-[28px] font-semibold text-textPrimary mt-1">{money.format(totalMonthlyCost)}</div>
          <p className="text-[12px] text-textMuted mt-1">Converted from monthly, quarterly, and yearly billing cycles.</p>
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 z-[200] bg-slate-900/40 flex items-start sm:items-center justify-center overflow-y-auto p-4" onMouseDown={() => { if (!isSaving) setModal(null); }}>
          <div className="bg-white rounded-[var(--radius-xl)] border border-border shadow-xl w-full max-w-[500px] max-h-[calc(100vh-2rem)] overflow-y-auto p-5 sm:p-6" onMouseDown={(event) => event.stopPropagation()}>
            <SubscriptionForm subscription={modal.mode === 'edit' ? modal.subscription : undefined} error={modalError} isSaving={isSaving} onCancel={() => setModal(null)} onSave={saveSubscription} />
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-[220] bg-slate-900/40 flex items-start sm:items-center justify-center overflow-y-auto p-4" onMouseDown={closeDeleteModal}>
          <div className="bg-white rounded-[var(--radius-xl)] border border-border shadow-xl w-full max-w-[460px] max-h-[calc(100vh-2rem)] overflow-y-auto p-5 sm:p-6" onMouseDown={(event) => event.stopPropagation()}>
            <h2 className="text-[16px] font-semibold text-textPrimary">Delete {deleteTarget.subscription.name}?</h2>
            <p className="text-[13px] text-textSecondary mt-2">
              This will archive the subscription and stop future auto-billing. Past transactions remain unchanged.
            </p>
            {deleteTarget.pastCount > 0 && (
              <div className="mt-4 rounded-md bg-blue-50 border border-blue-100 p-3 flex gap-2 text-[13px] text-blue-700">
                <Info size={15} className="shrink-0 mt-0.5" />
                <span>
                  {deleteTarget.pastCount} past recorded expense{deleteTarget.pastCount === 1 ? '' : 's'} will stay in your transaction history as a permanent record of what was spent.
                </span>
              </div>
            )}
            {deleteError && <p className="text-[13px] text-red-600 mt-3">{deleteError}</p>}
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-5 mt-5 border-t border-border">
              <button type="button" disabled={isDeleting} onClick={closeDeleteModal} className="px-4 py-2 rounded-md border border-border text-[13px] text-textSecondary hover:bg-slate-100 disabled:opacity-60">Cancel</button>
              <button type="button" disabled={isDeleting} onClick={confirmDelete} className="px-4 py-2 rounded-md bg-red-600 text-white text-[13px] font-medium hover:bg-red-700 disabled:opacity-60">{isDeleting ? 'Archiving...' : 'Archive Subscription'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[12px] font-medium text-textSecondary mb-1">{label}</span>
      {children}
    </label>
  );
}

function SubscriptionForm({ subscription, error, isSaving, onCancel, onSave }: { subscription?: Subscription; error: string | null; isSaving: boolean; onCancel: () => void; onSave: (formData: FormData, existing?: Subscription) => void }) {
  const defaultBillingDate = subscription?.nextBillingDate ? String(subscription.nextBillingDate).slice(0, 10) : computeNextBillingDate(new Date().getDate());

  return (
    <form onSubmit={(event) => { event.preventDefault(); onSave(new FormData(event.currentTarget), subscription); }} className="space-y-4">
      <div>
        <h2 className="text-[16px] font-semibold text-textPrimary">{subscription ? 'Edit Subscription' : 'Add Subscription'}</h2>
        <p className="text-[13px] text-textMuted">Expenses are auto-recorded on the billing date each cycle.</p>
        {subscription && <p className="text-[13px] text-amber-600 mt-1">Changing this will only affect future billings. Past transactions will remain unchanged.</p>}
        {error && <p className="text-[13px] text-red-600 mt-2">{error}</p>}
      </div>
      <Field label="Service Name">
        <input name="name" defaultValue={subscription?.name} className={inputClass} placeholder="Vercel Pro" required />
      </Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Cost">
          <input name="amount" type="number" min="0" step="0.01" defaultValue={subscription?.amount} className={inputClass} required />
        </Field>
        <Field label="Next Billing Date">
          <input name="nextBillingDate" type="date" defaultValue={defaultBillingDate} className={inputClass} required />
        </Field>
      </div>
      <Field label="Billing Cycle">
        <select name="billingCycle" defaultValue={subscription?.billingCycle || subscription?.cycle || 'MONTHLY'} className={inputClass}>
          <option value="MONTHLY">Monthly</option>
          <option value="QUARTERLY">Quarterly</option>
          <option value="YEARLY">Yearly</option>
        </select>
      </Field>
      <Field label="Status">
        <select name="status" defaultValue={subscription?.status || 'ACTIVE'} className={inputClass}>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </Field>
      <Field label="Notes">
        <input name="notes" defaultValue={subscription?.notes} className={inputClass} placeholder="Optional" />
      </Field>
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2 border-t border-border">
        <button type="button" disabled={isSaving} onClick={onCancel} className="px-4 py-2 rounded-md border border-border text-[13px] text-textSecondary hover:bg-slate-100 disabled:opacity-60">Cancel</button>
        <button disabled={isSaving} className="px-4 py-2 rounded-md bg-accent text-white text-[13px] font-medium hover:bg-accent-hover disabled:opacity-60">{isSaving ? 'Saving...' : 'Save Subscription'}</button>
      </div>
    </form>
  );
}
