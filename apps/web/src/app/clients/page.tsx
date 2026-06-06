'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import { computeNextBillingDate } from '@/store/financialStore';
import { useFinancialStore } from '@/store/useFinancialStore';
import { getClientRevenue } from '@/selectors/financialSelectors';
import { Client } from '@/types/finance';
import { makeCurrencyFormatter } from '@/lib/currency';
import { formatDate } from '@/lib/format';
import { useLocale } from '@/lib/i18n';
import { Avatar, Badge, Button, Card, EmptyState, Field, Icon, IconButton, InlineAlert, Input, SectionHeader, Select, StatCard } from '@/components/ui';

type ModalState = { mode: 'add' } | { mode: 'edit'; client: Client } | null;
type DeleteTarget = { client: Client; transactionCount: number; revenueTotal: number } | null;

const ClientRevenuePieChart = dynamic(
  () => import('@/components/charts/ClientRevenuePieChart').then((mod) => mod.ClientRevenuePieChart),
  { ssr: false, loading: () => <div className="h-[210px]" /> },
);

const makeId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const today = () => new Date().toISOString().slice(0, 10);

export default function ClientsPage() {
  const { clients, transactions, currency, isInitialized, addClient, updateClient, deleteClient, deleteClientPermanently, recordClientPayment } = useFinancialStore();
  const { t, locale } = useLocale();
  const [modal, setModal] = useState<ModalState>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeletingPermanent, setIsDeletingPermanent] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [recordingId, setRecordingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const money = useMemo(() => makeCurrencyFormatter(currency, { maximumFractionDigits: 0 }, locale), [currency, locale]);
  const moneyWithCents = useMemo(() => makeCurrencyFormatter(currency, undefined, locale), [currency, locale]);
  const currencyPrefix = useMemo(() => moneyWithCents.formatToParts(0).find((part) => part.type === 'currency')?.value || currency, [currency, moneyWithCents]);

  const openAddModal = () => { setModalError(null); setModal({ mode: 'add' }); };
  const openEditModal = (client: Client) => { setModalError(null); setModal({ mode: 'edit', client }); };
  const closeModal = () => { if (!isSaving) setModal(null); };
  const closeDeleteModal = () => { if (!isDeleting && !isDeletingPermanent) setDeleteTarget(null); };

  useEffect(() => {
    if (!isInitialized) return;
    const action = new URLSearchParams(window.location.search).get('action');
    if (action === 'client' || action === 'payment') {
      openAddModal();
      window.history.replaceState(null, '', '/clients');
    }
  }, [isInitialized]);

  const revenueForClient = (clientId: string) =>
    getClientRevenue(transactions, clientId);

  const transactionsForClient = (clientId: string) =>
    transactions.filter((tx) => tx.clientId === clientId || (tx.sourceType === 'client' && tx.sourceId === clientId));

  const visibleClients = useMemo(
    () => clients.filter((client) => showArchived || !client.archivedAt),
    [clients, showArchived],
  );

  const chartData = useMemo(
    () => visibleClients.map((client) => ({ name: client.name, value: revenueForClient(client.id) })).filter((row) => row.value > 0),
    [visibleClients, transactions],
  );
  const topClient = [...visibleClients].sort((a, b) => revenueForClient(b.id) - revenueForClient(a.id))[0];
  const clientStats = useMemo(() => ({
    active: clients.filter((client) => !client.archivedAt && client.status === 'ACTIVE').length,
    retainers: clients.filter((client) => !client.archivedAt && client.paymentType === 'retainer').length,
    recordedRevenue: clients.reduce((sum, client) => sum + revenueForClient(client.id), 0),
    archived: clients.filter((client) => client.archivedAt).length,
  }), [clients, transactions]);

  const recordPayment = async (client: Client) => {
    setRecordingId(client.id);
    setActionError(null);
    try {
      await recordClientPayment(client.id);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to record client payment');
    } finally {
      setRecordingId(null);
    }
  };

  const saveClient = async (formData: FormData, existing?: Client) => {
    const paymentType = String(formData.get('paymentType')) as Client['paymentType'];
    const paymentDate = String(formData.get('paymentDate') || today());
    const revenue = Number(formData.get('revenue') || 0);

    const nextBillingDateFromForm = paymentType === 'retainer' ? String(formData.get('nextBillingDate') || '') || undefined : undefined;
    const safeBillingDay = nextBillingDateFromForm
      ? Math.max(1, Math.min(28, new Date(`${nextBillingDateFromForm}T12:00:00`).getDate()))
      : undefined;

    const base = {
      name: String(formData.get('name') || '').trim(),
      company: String(formData.get('company') || '').trim(),
      email: String(formData.get('email') || '').trim(),
      revenue,
      clientType: String(formData.get('clientType') || 'COMPANY') as Client['clientType'],
      status: String(formData.get('status') || 'ACTIVE') as Client['status'],
      paymentType,
      paymentDate: paymentType === 'onetime' ? paymentDate : undefined,
      billingDay: safeBillingDay,
      nextBillingDate: nextBillingDateFromForm,
      recorded: existing?.recorded ?? false,
      updatedAt: new Date().toISOString(),
    };

    if (!base.name || revenue <= 0) return;

    setIsSaving(true);
    setModalError(null);
    try {
      if (existing) {
        await updateClient(existing.id, base);
      } else {
        await addClient({
          id: makeId(),
          ...base,
          createdAt: new Date().toISOString(),
        });
      }
      setModal(null);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Failed to save client');
    } finally {
      setIsSaving(false);
    }
  };

  const requestDelete = (client: Client) => {
    const linkedTransactions = transactionsForClient(client.id);
    setModal(null);
    setDeleteError(null);
    setDeleteTarget({
      client,
      transactionCount: linkedTransactions.length,
      revenueTotal: linkedTransactions.filter((tx) => tx.type === 'INCOME').reduce((sum, tx) => sum + tx.amount, 0),
    });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteClient(deleteTarget.client.id);
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete client');
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmDeletePermanently = async () => {
    if (!deleteTarget) return;
    setIsDeletingPermanent(true);
    setDeleteError(null);
    try {
      await deleteClientPermanently(deleteTarget.client.id);
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to permanently delete client');
    } finally {
      setIsDeletingPermanent(false);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-10">
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h1 className="t-h1">{t('clients.title')}</h1>
            <p className="t-body mt-1 text-text-muted">{t('clients.subtitle')}</p>
          </div>
          <Button icon="Plus" onClick={openAddModal} className="w-full sm:w-auto">{t('clients.addClient')}</Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label={t('clients.stats.active')} value={clientStats.active} icon="Users" />
          <StatCard label={t('clients.stats.retainers')} value={clientStats.retainers} icon="Repeat" />
          <StatCard label={t('clients.stats.recordedRevenue')} value={money.format(clientStats.recordedRevenue)} tone="positive" icon="TrendingUp" />
          <StatCard label={t('clients.stats.archived')} value={clientStats.archived} icon="Archive" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
        <Card pad={0} className="overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-border flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <SectionHeader title="Client book" sub={`${visibleClients.length} client${visibleClients.length === 1 ? '' : 's'} shown`} className="mb-0" />
            </div>
            <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
              <button type="button" onClick={() => setShowArchived(false)} className={`focus-ring h-8 px-3 rounded-full text-[13px] font-medium border transition-all ${!showArchived ? 'border-transparent bg-accent text-accent-fg' : 'border-border bg-surface hover:bg-surface-hover text-text-secondary'}`}>Active</button>
              <button type="button" onClick={() => setShowArchived(true)} className={`focus-ring h-8 px-3 rounded-full text-[13px] font-medium border transition-all ${showArchived ? 'border-transparent bg-accent text-accent-fg' : 'border-border bg-surface hover:bg-surface-hover text-text-secondary'}`}>Include archived</button>
            </div>
          </div>
          {actionError && <div className="mx-4 mt-4 sm:mx-5"><InlineAlert tone="negative">{actionError}</InlineAlert></div>}

          {visibleClients.length === 0 ? (
            <EmptyState icon="Users" title={t('clients.empty.title')} body={t('clients.empty.body')} action={<Button icon="Plus" onClick={openAddModal}>{t('clients.addClient')}</Button>} />
          ) : (
            <div className="divide-y divide-border">
              {visibleClients.map((client) => {
                const clientTransactions = transactionsForClient(client.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                const totalPaid = clientTransactions.filter((tx) => tx.type === 'INCOME').reduce((sum, tx) => sum + tx.amount, 0);
                return (
                <div key={client.id} className="p-4 flex flex-col gap-4 hover:bg-surface-hover transition-colors">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3 min-w-0 sm:items-center">
                    <Avatar name={client.name} size={40} color="--viz-1" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="t-body-m text-text">{client.name}</span>
                        <Badge tone={client.paymentType === 'retainer' ? 'accent' : 'positive'}>{client.paymentType === 'retainer' ? 'Retainer' : 'One-time'}</Badge>
                        <Badge tone={client.status === 'ACTIVE' ? 'positive' : client.status === 'PROSPECT' ? 'warning' : 'neutral'}>{client.status}</Badge>
                        {client.archivedAt && <Badge>{t('clients.badges.archived')}</Badge>}
                      </div>
                      <div className="text-sm text-text-muted mt-1">
                        {client.paymentType === 'retainer'
                          ? `${money.format(client.revenue)}/mo - next ${client.nextBillingDate ? formatDate(client.nextBillingDate, locale) : 'not scheduled'}`
                          : `${money.format(client.revenue)} - payment ${client.paymentDate ? formatDate(client.paymentDate, locale) : 'not scheduled'}`}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <div className="text-left sm:text-right">
                      <div className="text-sm font-mono font-semibold text-positive">{money.format(totalPaid)}</div>
                      <div className="text-xs text-text-muted">{t('clients.payment.totalPaid')}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {client.paymentType === 'retainer' && client.status === 'ACTIVE' && !client.archivedAt && (
                        <IconButton icon="DollarSign" size="sm" disabled={recordingId === client.id} onClick={() => recordPayment(client)} title={`Record payment for ${client.name}`} className="text-positive hover:text-positive" />
                      )}
                      <IconButton icon="Pencil" size="sm" onClick={() => openEditModal(client)} title={`Edit ${client.name}`} />
                      <Button type="button" variant="secondary" size="sm" icon="Archive" onClick={() => requestDelete(client)}>
                        Archive
                      </Button>
                    </div>
                  </div>
                  </div>
                  <div className="rounded-md bg-surface-hover border border-border p-3">
                    <div className="flex flex-col gap-1 text-xs text-text-secondary sm:flex-row sm:items-center sm:justify-between">
                      <span>Payment history</span>
                      {client.paymentType === 'retainer' && <span>Next billing: {client.nextBillingDate ? formatDate(client.nextBillingDate, locale) : 'not scheduled'}</span>}
                    </div>
                    {clientTransactions.length === 0 ? (
                      <div className="text-xs text-text-muted mt-2">{t('clients.history.empty')}</div>
                    ) : (
                      <div className="mt-2 space-y-1">
                        {clientTransactions.slice(0, 3).map((tx) => (
                          <div key={tx.id} className="flex items-center justify-between gap-3 text-xs">
                            <span className="truncate text-text">{tx.name || tx.notes || 'Payment'}</span>
                            <span className="shrink-0 text-text-muted">{formatDate(tx.date, locale)} - {money.format(tx.amount)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );})}
            </div>
          )}
        </Card>

        <div className="space-y-6">
          <Card className="h-[300px] overflow-hidden" pad={20}>
            <SectionHeader title="Revenue overview" sub="Recorded client payments" />
            {chartData.length === 0 ? (
              <div className="h-[210px] flex items-center justify-center text-sm text-text-muted">No recorded client revenue yet</div>
            ) : (
              <ClientRevenuePieChart data={chartData} formatAmount={money.format} />
            )}
          </Card>
          <Card pad={20}>
            <SectionHeader title="Top client" sub="Highest recorded revenue" />
            {topClient ? (
              <div className="mt-4">
                <div className="t-h3 text-text">{topClient.name}</div>
                <div className="t-display font-mono text-positive mt-2">{money.format(revenueForClient(topClient.id))}</div>
                <p className="text-sm text-text-muted mt-1">Total recorded revenue</p>
              </div>
            ) : <p className="text-sm text-text-muted mt-4">{t('clients.top.empty')}</p>}
          </Card>
        </div>
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-start sm:items-center justify-center overflow-y-auto p-4" onMouseDown={closeModal}>
          <Card role="dialog" aria-modal="true" className="w-full max-w-[520px] max-h-[calc(100vh-2rem)] overflow-y-auto shadow-xl my-8" pad={24} onMouseDown={(event) => event.stopPropagation()}>
            <ClientForm client={modal.mode === 'edit' ? modal.client : undefined} currencyPrefix={currencyPrefix} error={modalError} isSaving={isSaving} onCancel={closeModal} onSave={saveClient} />
          </Card>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-[220] bg-black/40 backdrop-blur-sm flex items-start sm:items-center justify-center overflow-y-auto p-4" onMouseDown={closeDeleteModal}>
          <Card role="dialog" aria-modal="true" className="w-full max-w-[460px] max-h-[calc(100vh-2rem)] overflow-y-auto shadow-xl my-8" pad={24} onMouseDown={(event) => event.stopPropagation()}>
            <h2 className="t-h3">Archive {deleteTarget.client.name}?</h2>
            <p className="text-sm text-text-secondary mt-2">
              Archiving keeps past payments in history and stops future billing. Permanent delete is still available if you need to wipe the client and linked transactions.
            </p>
            <div className="mt-4 space-y-2">
              <div className="rounded-md bg-info-tint border border-info-border p-3 text-sm text-info">
                <span className="font-medium">Archive:</span> {deleteTarget.transactionCount} historical transaction{deleteTarget.transactionCount === 1 ? '' : 's'} totaling {money.format(deleteTarget.revenueTotal)} will stay in analytics and payment history.
              </div>
              <div className="rounded-md bg-negative-tint border border-negative-border p-3 text-sm text-negative">
                <span className="font-medium">Delete permanently:</span> {deleteTarget.transactionCount} historical transaction{deleteTarget.transactionCount === 1 ? '' : 's'} totaling {money.format(deleteTarget.revenueTotal)} will be removed from analytics and the ledger. This cannot be undone.
              </div>
            </div>
            {deleteError && <div className="mt-3"><InlineAlert tone="negative">{deleteError}</InlineAlert></div>}
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-5 mt-5 border-t border-border">
              <Button type="button" variant="ghost" disabled={isDeleting || isDeletingPermanent} onClick={closeDeleteModal}>Cancel</Button>
              <Button type="button" variant="secondary" loading={isDeleting} disabled={isDeletingPermanent} onClick={confirmDelete}>{isDeleting ? 'Archiving...' : 'Archive'}</Button>
              <Button type="button" variant="destructive" loading={isDeletingPermanent} disabled={isDeleting} onClick={confirmDeletePermanently}>{isDeletingPermanent ? 'Deleting...' : 'Delete permanently'}</Button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}

function ClientForm({ client, currencyPrefix, error, isSaving, onCancel, onSave }: { client?: Client; currencyPrefix: string; error: string | null; isSaving: boolean; onCancel: () => void; onSave: (formData: FormData, existing?: Client) => void }) {
  const [paymentType, setPaymentType] = useState<Client['paymentType']>(client?.paymentType || 'onetime');

  return (
    <form onSubmit={(event) => { event.preventDefault(); onSave(new FormData(event.currentTarget), client); }} className="space-y-4">
      <div>
        <h2 className="t-h3">{client ? 'Edit client' : 'Add client'}</h2>
        <p className="text-sm text-text-muted mt-1">One-time clients record once. Retainers auto-record monthly income.</p>
      </div>
      {client && <InlineAlert tone="warning">Changes to amount or billing date only affect future billings. Past transactions remain unchanged.</InlineAlert>}
      {error && <InlineAlert tone="negative">{error}</InlineAlert>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Client name">
          <Input name="name" defaultValue={client?.name} required />
        </Field>
        <Field label="Amount">
          <Input name="revenue" type="number" min="0" step="0.01" defaultValue={client?.revenue} required prefix={currencyPrefix} />
        </Field>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Company">
          <Input name="company" defaultValue={client?.company} />
        </Field>
        <Field label="Email">
          <Input name="email" type="email" defaultValue={client?.email} />
        </Field>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Client Type">
          <Select name="clientType" defaultValue={client?.clientType || 'COMPANY'}>
            <option value="COMPANY">Company</option>
            <option value="INDIVIDUAL">Individual</option>
          </Select>
        </Field>
        <Field label="Status">
          <Select name="status" defaultValue={client?.status || 'ACTIVE'}>
            <option value="ACTIVE">Active</option>
            <option value="PROSPECT">Prospect</option>
            <option value="COMPLETED">Completed</option>
            <option value="INACTIVE">Inactive</option>
          </Select>
        </Field>
      </div>
      <Field label="Payment type">
        <Select name="paymentType" value={paymentType} onChange={(event) => setPaymentType(event.target.value as Client['paymentType'])}>
          <option value="onetime">One-time payment</option>
          <option value="retainer">Monthly retainer</option>
        </Select>
      </Field>
      {paymentType === 'onetime' ? (
        <Field label="Payment date">
          <Input name="paymentDate" type="date" defaultValue={client?.paymentDate ? String(client.paymentDate).slice(0, 10) : today()} required />
        </Field>
      ) : (
        <Field label="Next billing date">
          <Input name="nextBillingDate" type="date" defaultValue={client?.nextBillingDate ? String(client.nextBillingDate).slice(0, 10) : computeNextBillingDate(new Date().getDate())} required />
        </Field>
      )}
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2 border-t border-border">
        <Button type="button" variant="ghost" disabled={isSaving} onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={isSaving}>{isSaving ? 'Saving...' : 'Save client'}</Button>
      </div>
    </form>
  );
}
