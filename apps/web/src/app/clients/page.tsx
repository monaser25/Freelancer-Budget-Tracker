'use client';

import { useEffect, useMemo, useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { computeNextBillingDate } from '@/store/financialStore';
import { useFinancialStore } from '@/store/useFinancialStore';
import { getClientRevenue } from '@/selectors/financialSelectors';
import { Client } from '@/types/finance';
import { makeCurrencyFormatter } from '@/lib/currency';
import { DollarSign, Pencil, Plus, Trash2, Users } from 'lucide-react';

type ModalState = { mode: 'add' } | { mode: 'edit'; client: Client } | null;
type DeleteTarget = { client: Client; transactionCount: number; revenueTotal: number } | null;

const inputClass = 'w-full px-3 py-2 border border-border rounded-md text-[13px] outline-none focus:border-accent bg-background';
const colors = ['#2563EB', '#16A34A', '#F59E0B', '#9333EA', '#EF4444'];

const makeId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const today = () => new Date().toISOString().slice(0, 10);

export default function ClientsPage() {
  const { clients, transactions, currency, isInitialized, addClient, updateClient, deleteClient, recordClientPayment } = useFinancialStore();
  const [modal, setModal] = useState<ModalState>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [recordingId, setRecordingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const money = useMemo(() => makeCurrencyFormatter(currency, { maximumFractionDigits: 0 }), [currency]);

  const openAddModal = () => { setModalError(null); setModal({ mode: 'add' }); };
  const openEditModal = (client: Client) => { setModalError(null); setModal({ mode: 'edit', client }); };
  const closeModal = () => { if (!isSaving) setModal(null); };
  const closeDeleteModal = () => { if (!isDeleting) setDeleteTarget(null); };

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

  return (
    <>
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
        <div className="bg-card border border-border rounded-[var(--radius-lg)] overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-border flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-[14px] font-semibold text-textPrimary">Clients</h1>
              <p className="text-[12px] text-textMuted mt-1">Revenue sources, payment schedules, and total earnings</p>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
              <label className="inline-flex items-center gap-2 text-[12px] text-textSecondary">
                <input type="checkbox" checked={showArchived} onChange={(event) => setShowArchived(event.target.checked)} />
                Show archived
              </label>
              <button type="button" onClick={openAddModal} className="inline-flex w-full items-center justify-center gap-2 px-3 py-2 rounded-md bg-accent text-white text-[13px] font-medium hover:bg-accent-hover sm:w-auto">
                <Plus size={15} /> Add Client
              </button>
            </div>
          </div>
          {actionError && <div className="mx-4 mt-4 rounded-md bg-red-50 border border-red-100 px-3 py-2 text-[13px] text-red-600 sm:mx-5">{actionError}</div>}

          {visibleClients.length === 0 ? (
            <div className="text-center py-10 text-textMuted">
              <div className="flex justify-center mb-3 text-slate-300"><Users size={34} /></div>
              <p className="text-[13px]">No clients yet. Add a one-time payment or monthly retainer client.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {visibleClients.map((client) => {
                const clientTransactions = transactionsForClient(client.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                const totalPaid = clientTransactions.filter((tx) => tx.type === 'INCOME').reduce((sum, tx) => sum + tx.amount, 0);
                return (
                <div key={client.id} className="p-4 flex flex-col gap-4 hover:bg-slate-50">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3 min-w-0 sm:items-center">
                    <div className="w-9 h-9 rounded-full bg-accent text-white flex items-center justify-center text-[13px] font-semibold shrink-0">
                      {client.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[13.5px] font-medium text-textPrimary">{client.name}</span>
                        <Badge tone={client.paymentType === 'retainer' ? 'blue' : 'green'}>{client.paymentType === 'retainer' ? 'Retainer' : 'One-time'}</Badge>
                        <Badge tone={client.status === 'ACTIVE' ? 'green' : client.status === 'PROSPECT' ? 'amber' : 'slate'}>{client.status}</Badge>
                        {client.archivedAt && <Badge tone="slate">Archived</Badge>}
                      </div>
                      <div className="text-[12px] text-textMuted mt-1">
                        {client.paymentType === 'retainer'
                          ? `${money.format(client.revenue)}/mo - next ${client.nextBillingDate ? new Date(client.nextBillingDate).toLocaleDateString() : 'not scheduled'}`
                          : `${money.format(client.revenue)} - payment ${client.paymentDate ? new Date(client.paymentDate).toLocaleDateString() : 'not scheduled'}`}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <div className="text-left sm:text-right">
                      <div className="text-[14px] font-mono font-semibold text-green-600">{money.format(totalPaid)}</div>
                      <div className="text-[11px] text-textMuted">total paid</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {client.paymentType === 'retainer' && client.status === 'ACTIVE' && !client.archivedAt && (
                        <button type="button" disabled={recordingId === client.id} onClick={() => recordPayment(client)} className="text-green-600 hover:text-green-700 p-1 inline-flex disabled:opacity-60" aria-label={`Record payment for ${client.name}`}>
                          <DollarSign size={15} />
                        </button>
                      )}
                      <button type="button" onClick={() => openEditModal(client)} className="text-textSecondary hover:text-accent p-1 inline-flex" aria-label={`Edit ${client.name}`}>
                        <Pencil size={15} />
                      </button>
                      <button type="button" onClick={() => requestDelete(client)} className="text-red-500 hover:text-red-700 p-1 inline-flex" aria-label={`Delete ${client.name}`}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                  </div>
                  <div className="rounded-md bg-slate-50 border border-slate-100 p-3">
                    <div className="flex flex-col gap-1 text-[12px] text-textSecondary sm:flex-row sm:items-center sm:justify-between">
                      <span>Payment history</span>
                      {client.paymentType === 'retainer' && <span>Next billing: {client.nextBillingDate ? new Date(client.nextBillingDate).toLocaleDateString() : 'not scheduled'}</span>}
                    </div>
                    {clientTransactions.length === 0 ? (
                      <div className="text-[12px] text-textMuted mt-2">No payments recorded yet.</div>
                    ) : (
                      <div className="mt-2 space-y-1">
                        {clientTransactions.slice(0, 3).map((tx) => (
                          <div key={tx.id} className="flex items-center justify-between gap-3 text-[12px]">
                            <span className="truncate text-textPrimary">{tx.name || tx.notes || 'Payment'}</span>
                            <span className="shrink-0 text-textMuted">{new Date(tx.date).toLocaleDateString()} · {money.format(tx.amount)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );})}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-card border border-border rounded-[var(--radius-lg)] p-4 sm:p-5 h-[300px] overflow-hidden">
            <h2 className="text-[14px] font-semibold text-textPrimary">Revenue Overview</h2>
            {chartData.length === 0 ? (
              <div className="h-[230px] flex items-center justify-center text-[13px] text-textMuted">No recorded client revenue yet</div>
            ) : (
              <ResponsiveContainer width="100%" height="86%">
                <PieChart>
                  <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={54} outerRadius={88}>
                    {chartData.map((entry, index) => <Cell key={entry.name} fill={colors[index % colors.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value) => money.format(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="bg-card border border-border rounded-[var(--radius-lg)] p-5">
            <h2 className="text-[14px] font-semibold text-textPrimary">Top Client</h2>
            {topClient ? (
              <div className="mt-4">
                <div className="text-[18px] font-semibold text-textPrimary">{topClient.name}</div>
                <div className="text-[28px] font-semibold text-green-600 mt-2">{money.format(revenueForClient(topClient.id))}</div>
                <p className="text-[12px] text-textMuted mt-1">Total recorded revenue</p>
              </div>
            ) : <p className="text-[13px] text-textMuted mt-4">No clients yet</p>}
          </div>
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 z-[200] bg-slate-900/40 flex items-start sm:items-center justify-center overflow-y-auto p-4" onMouseDown={closeModal}>
          <div className="bg-white rounded-[var(--radius-xl)] border border-border shadow-xl w-full max-w-[520px] max-h-[calc(100vh-2rem)] overflow-y-auto p-5 sm:p-6" onMouseDown={(event) => event.stopPropagation()}>
            <ClientForm client={modal.mode === 'edit' ? modal.client : undefined} error={modalError} isSaving={isSaving} onCancel={closeModal} onSave={saveClient} />
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-[220] bg-slate-900/40 flex items-start sm:items-center justify-center overflow-y-auto p-4" onMouseDown={closeDeleteModal}>
          <div className="bg-white rounded-[var(--radius-xl)] border border-border shadow-xl w-full max-w-[460px] max-h-[calc(100vh-2rem)] overflow-y-auto p-5 sm:p-6" onMouseDown={(event) => event.stopPropagation()}>
            <h2 className="text-[16px] font-semibold text-textPrimary">Archive {deleteTarget.client.name}?</h2>
            <p className="text-[13px] text-textSecondary mt-2">
              Archiving this client stops future recurring billings. Past transactions remain unchanged.
            </p>
            <div className="mt-4 rounded-md bg-red-50 border border-red-100 p-3 text-[13px] text-red-700">
              {deleteTarget.transactionCount} historical transaction{deleteTarget.transactionCount === 1 ? '' : 's'} totaling {money.format(deleteTarget.revenueTotal)} will stay in reports and payment history.
            </div>
            {deleteError && <p className="text-[13px] text-red-600 mt-3">{deleteError}</p>}
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-5 mt-5 border-t border-border">
              <button type="button" disabled={isDeleting} onClick={closeDeleteModal} className="px-4 py-2 rounded-md border border-border text-[13px] text-textSecondary hover:bg-slate-100 disabled:opacity-60">Cancel</button>
              <button type="button" disabled={isDeleting} onClick={confirmDelete} className="px-4 py-2 rounded-md bg-red-600 text-white text-[13px] font-medium hover:bg-red-700 disabled:opacity-60">{isDeleting ? 'Archiving...' : 'Archive Client'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Badge({ children, tone }: { children: React.ReactNode; tone: 'blue' | 'green' | 'amber' | 'slate' }) {
  const classes = {
    blue: 'bg-blue-50 text-accent',
    green: 'bg-green-50 text-green-700',
    amber: 'bg-amber-50 text-amber-600',
    slate: 'bg-slate-100 text-textSecondary',
  };
  return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${classes[tone]}`}>{children}</span>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[12px] font-medium text-textSecondary mb-1">{label}</span>
      {children}
    </label>
  );
}

function ClientForm({ client, error, isSaving, onCancel, onSave }: { client?: Client; error: string | null; isSaving: boolean; onCancel: () => void; onSave: (formData: FormData, existing?: Client) => void }) {
  const [paymentType, setPaymentType] = useState<Client['paymentType']>(client?.paymentType || 'onetime');

  return (
    <form onSubmit={(event) => { event.preventDefault(); onSave(new FormData(event.currentTarget), client); }} className="space-y-4">
      <div>
        <h2 className="text-[16px] font-semibold text-textPrimary">{client ? 'Edit Client' : 'Add Client'}</h2>
        <p className="text-[13px] text-textMuted">One-time clients record once. Retainers auto-record monthly income.</p>
        {client && <p className="text-[13px] text-amber-600 mt-1">Changing this will only affect future billings. Past transactions will remain unchanged.</p>}
        {error && <p className="text-[13px] text-red-600 mt-2">{error}</p>}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Client Name">
          <input name="name" defaultValue={client?.name} className={inputClass} required />
        </Field>
        <Field label="Amount">
          <input name="revenue" type="number" min="0" step="0.01" defaultValue={client?.revenue} className={inputClass} required />
        </Field>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Company">
          <input name="company" defaultValue={client?.company} className={inputClass} />
        </Field>
        <Field label="Email">
          <input name="email" type="email" defaultValue={client?.email} className={inputClass} />
        </Field>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Client Type">
          <select name="clientType" defaultValue={client?.clientType || 'COMPANY'} className={inputClass}>
            <option value="COMPANY">Company</option>
            <option value="INDIVIDUAL">Individual</option>
          </select>
        </Field>
        <Field label="Status">
          <select name="status" defaultValue={client?.status || 'ACTIVE'} className={inputClass}>
            <option value="ACTIVE">Active</option>
            <option value="PROSPECT">Prospect</option>
            <option value="COMPLETED">Completed</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </Field>
      </div>
      <Field label="Payment Type">
        <select name="paymentType" value={paymentType} onChange={(event) => setPaymentType(event.target.value as Client['paymentType'])} className={inputClass}>
          <option value="onetime">One-time payment</option>
          <option value="retainer">Monthly retainer</option>
        </select>
      </Field>
      {paymentType === 'onetime' ? (
        <Field label="Payment Date">
          <input name="paymentDate" type="date" defaultValue={client?.paymentDate ? String(client.paymentDate).slice(0, 10) : today()} className={inputClass} required />
        </Field>
      ) : (
        <Field label="Next Billing Date">
          <input name="nextBillingDate" type="date" defaultValue={client?.nextBillingDate ? String(client.nextBillingDate).slice(0, 10) : computeNextBillingDate(new Date().getDate())} className={inputClass} required />
        </Field>
      )}
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2 border-t border-border">
        <button type="button" disabled={isSaving} onClick={onCancel} className="px-4 py-2 rounded-md border border-border text-[13px] text-textSecondary hover:bg-slate-100 disabled:opacity-60">Cancel</button>
        <button disabled={isSaving} className="px-4 py-2 rounded-md bg-accent text-white text-[13px] font-medium hover:bg-accent-hover disabled:opacity-60">{isSaving ? 'Saving...' : 'Save Client'}</button>
      </div>
    </form>
  );
}
