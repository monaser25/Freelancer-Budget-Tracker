'use client';

import { useEffect, useMemo, useState } from 'react';
import { computeNextBillingDate } from '@/store/financialStore';
import { useFinancialStore } from '@/store/useFinancialStore';
import { Subscription } from '@/types/finance';
import { makeCurrencyFormatter } from '@/lib/currency';
import { Badge, Button, Card, EmptyState, Field, Icon, IconButton, InlineAlert, Input, SectionHeader, Select, StatCard } from '@/components/ui';

type ModalState = { mode: 'add' } | { mode: 'edit'; subscription: Subscription } | null;
type DeleteTarget = { subscription: Subscription; pastCount: number } | null;

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
  const subscriptionStats = useMemo(() => ({
    active: subscriptions.filter((sub) => !sub.archivedAt && sub.status === 'ACTIVE').length,
    monthlyCost: subscriptions.filter((sub) => !sub.archivedAt && sub.status === 'ACTIVE').reduce((sum, sub) => sum + monthlyEquivalent(sub), 0),
    yearlyRunRate: subscriptions.filter((sub) => !sub.archivedAt && sub.status === 'ACTIVE').reduce((sum, sub) => sum + monthlyEquivalent(sub), 0) * 12,
    archived: subscriptions.filter((sub) => sub.archivedAt).length,
  }), [subscriptions]);

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
      <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-10">
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h1 className="t-h1">Tool subscriptions</h1>
            <p className="t-body mt-1 text-text-muted">Software and services that generate recurring expenses</p>
          </div>
          <Button icon="Plus" onClick={() => { setModalError(null); setModal({ mode: 'add' }); }} className="w-full sm:w-auto">Add subscription</Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Active tools" value={subscriptionStats.active} icon="CreditCard" />
          <StatCard label="Monthly cost" value={money.format(subscriptionStats.monthlyCost)} tone="negative" icon="Receipt" />
          <StatCard label="Annual run rate" value={money.format(subscriptionStats.yearlyRunRate)} tone="negative" icon="TrendingDown" />
          <StatCard label="Archived" value={subscriptionStats.archived} icon="Archive" />
        </div>

        <Card pad={0} className="overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-border flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <SectionHeader title="Subscription stack" sub={`${visibleSubscriptions.length} subscription${visibleSubscriptions.length === 1 ? '' : 's'} shown`} className="mb-0" />
            <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
              <button type="button" onClick={() => setShowArchived(false)} className={`focus-ring h-8 px-3 rounded-full text-[13px] font-medium border transition-all ${!showArchived ? 'border-transparent bg-accent text-accent-fg' : 'border-border bg-surface hover:bg-surface-hover text-text-secondary'}`}>Active</button>
              <button type="button" onClick={() => setShowArchived(true)} className={`focus-ring h-8 px-3 rounded-full text-[13px] font-medium border transition-all ${showArchived ? 'border-transparent bg-accent text-accent-fg' : 'border-border bg-surface hover:bg-surface-hover text-text-secondary'}`}>Include archived</button>
            </div>
          </div>
          {actionError && <div className="mx-4 mt-4 sm:mx-5"><InlineAlert tone="negative">{actionError}</InlineAlert></div>}

          {visibleSubscriptions.length === 0 ? (
            <EmptyState icon="CreditCard" title="No tool subscriptions yet" body="Add recurring software costs here to keep monthly expenses visible." action={<Button icon="Plus" onClick={() => { setModalError(null); setModal({ mode: 'add' }); }}>Add subscription</Button>} />
          ) : (
            <div className="divide-y divide-border">
              {visibleSubscriptions.map((sub) => (
                <div key={sub.id} className="p-4 flex flex-col gap-4 hover:bg-surface-hover transition-colors sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3 sm:items-center">
                    <div className="w-10 h-10 rounded-lg bg-negative-tint text-negative flex items-center justify-center shrink-0">
                      <Icon name="CreditCard" size={18} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="t-body-m text-text">{sub.name}</span>
                        <Badge tone={sub.status === 'ACTIVE' ? 'positive' : 'neutral'}>{sub.status}</Badge>
                        <Badge tone="accent">{(sub.billingCycle || sub.cycle).toLowerCase()}</Badge>
                        {sub.archivedAt && <Badge>Archived</Badge>}
                      </div>
                      <div className="text-sm text-text-muted mt-1">
                        next {new Date(sub.nextBillingDate).toLocaleDateString()}
                        {sub.notes ? ` - ${sub.notes}` : ''}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <div className="text-left sm:text-right">
                      <div className="text-sm font-mono font-semibold text-negative">{money.format(monthlyEquivalent(sub))}/mo</div>
                      <div className="text-xs text-text-muted">{money.format(sub.amount)} billed</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {sub.status === 'ACTIVE' && !sub.archivedAt && (
                        <IconButton icon="DollarSign" size="sm" disabled={recordingId === sub.id} onClick={() => recordPayment(sub)} title={`Record payment for ${sub.name}`} className="text-positive hover:text-positive" />
                      )}
                      <IconButton icon="Pencil" size="sm" onClick={() => { setModalError(null); setModal({ mode: 'edit', subscription: sub }); }} title={`Edit ${sub.name}`} />
                      <IconButton icon="Trash2" size="sm" onClick={() => requestDelete(sub)} title={`Delete ${sub.name}`} className="text-negative hover:text-negative" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card pad={20} className="max-w-md">
          <div className="t-caption text-text-muted">Total monthly cost</div>
          <div className="t-display font-mono text-negative mt-1">{money.format(totalMonthlyCost)}</div>
          <p className="text-sm text-text-muted mt-1">Converted from monthly, quarterly, and yearly billing cycles.</p>
        </Card>
      </div>

      {modal && (
        <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-start sm:items-center justify-center overflow-y-auto p-4" onMouseDown={() => { if (!isSaving) setModal(null); }}>
          <Card role="dialog" aria-modal="true" className="w-full max-w-[500px] max-h-[calc(100vh-2rem)] overflow-y-auto shadow-xl my-8" pad={24} onMouseDown={(event) => event.stopPropagation()}>
            <SubscriptionForm subscription={modal.mode === 'edit' ? modal.subscription : undefined} error={modalError} isSaving={isSaving} onCancel={() => setModal(null)} onSave={saveSubscription} />
          </Card>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-[220] bg-black/40 backdrop-blur-sm flex items-start sm:items-center justify-center overflow-y-auto p-4" onMouseDown={closeDeleteModal}>
          <Card role="dialog" aria-modal="true" className="w-full max-w-[460px] max-h-[calc(100vh-2rem)] overflow-y-auto shadow-xl my-8" pad={24} onMouseDown={(event) => event.stopPropagation()}>
            <h2 className="t-h3">Remove {deleteTarget.subscription.name}?</h2>
            <p className="text-sm text-text-secondary mt-2">
              This will move the subscription to Archive and stop future billing. Past transactions will remain in history.
            </p>
            {deleteTarget.pastCount > 0 && (
              <div className="mt-4 rounded-md bg-info-tint border border-info-border p-3 flex gap-2 text-sm text-info">
                <Icon name="Info" size={15} className="shrink-0 mt-0.5" />
                <span>
                  {deleteTarget.pastCount} past recorded expense{deleteTarget.pastCount === 1 ? '' : 's'} will stay in your transaction history as a permanent record of what was spent.
                </span>
              </div>
            )}
            {deleteError && <div className="mt-3"><InlineAlert tone="negative">{deleteError}</InlineAlert></div>}
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-5 mt-5 border-t border-border">
              <Button type="button" variant="ghost" disabled={isDeleting} onClick={closeDeleteModal}>Cancel</Button>
              <Button type="button" variant="destructive" loading={isDeleting} onClick={confirmDelete}>{isDeleting ? 'Removing...' : 'Remove subscription'}</Button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}

function SubscriptionForm({ subscription, error, isSaving, onCancel, onSave }: { subscription?: Subscription; error: string | null; isSaving: boolean; onCancel: () => void; onSave: (formData: FormData, existing?: Subscription) => void }) {
  const defaultBillingDate = subscription?.nextBillingDate ? String(subscription.nextBillingDate).slice(0, 10) : computeNextBillingDate(new Date().getDate());

  return (
    <form onSubmit={(event) => { event.preventDefault(); onSave(new FormData(event.currentTarget), subscription); }} className="space-y-4">
      <div>
        <h2 className="t-h3">{subscription ? 'Edit subscription' : 'Add subscription'}</h2>
        <p className="text-sm text-text-muted mt-1">Expenses are auto-recorded on the billing date each cycle.</p>
      </div>
      {subscription && <InlineAlert tone="warning">Changes to amount, cycle, or billing date only affect future billings. Past transactions remain unchanged.</InlineAlert>}
      {error && <InlineAlert tone="negative">{error}</InlineAlert>}
      <Field label="Service name">
        <Input name="name" defaultValue={subscription?.name} placeholder="Vercel Pro" required />
      </Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Cost">
          <Input name="amount" type="number" min="0" step="0.01" defaultValue={subscription?.amount} required />
        </Field>
        <Field label="Next billing date">
          <Input name="nextBillingDate" type="date" defaultValue={defaultBillingDate} required />
        </Field>
      </div>
      <Field label="Billing cycle">
        <Select name="billingCycle" defaultValue={subscription?.billingCycle || subscription?.cycle || 'MONTHLY'}>
          <option value="MONTHLY">Monthly</option>
          <option value="QUARTERLY">Quarterly</option>
          <option value="YEARLY">Yearly</option>
        </Select>
      </Field>
      <Field label="Status">
        <Select name="status" defaultValue={subscription?.status || 'ACTIVE'}>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </Select>
      </Field>
      <Field label="Notes">
        <Input name="notes" defaultValue={subscription?.notes} placeholder="Optional" />
      </Field>
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2 border-t border-border">
        <Button type="button" variant="ghost" disabled={isSaving} onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={isSaving}>{isSaving ? 'Saving...' : 'Save subscription'}</Button>
      </div>
    </form>
  );
}
