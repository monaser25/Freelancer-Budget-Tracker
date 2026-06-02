'use client';

import { useEffect, useMemo, useState } from 'react';
import { useFinancialStore } from '@/store/useFinancialStore';
import { Transaction } from '@/types/finance';
import { makeCurrencyFormatter } from '@/lib/currency';
import { Pencil, Plus, Trash2, WalletCards } from 'lucide-react';

type Filter = 'all' | 'revenue' | 'expenses' | 'subscriptions' | 'client' | 'tools' | 'operations';

const filters: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'revenue', label: 'Revenue' },
  { id: 'expenses', label: 'Expenses' },
  { id: 'subscriptions', label: 'Subscriptions' },
  { id: 'client', label: 'Client' },
  { id: 'tools', label: 'Tools' },
  { id: 'operations', label: 'Operations' },
];

const inputClass = 'w-full px-3 py-2 border border-border rounded-md text-[13px] outline-none focus:border-accent bg-background';
const today = () => new Date().toISOString().slice(0, 10);

function toIsoDate(date: string) {
  return new Date(`${date}T12:00:00`).toISOString();
}

const makeId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const isAutoTransaction = (tx: Transaction) => Boolean(tx.isAuto) || tx.sourceType !== 'manual';

export default function TransactionsPage() {
  const { transactions, currency, addTransaction, updateTransaction, deleteTransaction } = useFinancialStore();
  const [filter, setFilter] = useState<Filter>('all');
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState<Transaction | null>(null);
  const [adding, setAdding] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const money = useMemo(() => makeCurrencyFormatter(currency, { minimumFractionDigits: 2 }), [currency]);

  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get('filter') as Filter | null;
    if (param && filters.some((item) => item.id === param)) setFilter(param);
  }, []);

  const filteredTransactions = useMemo(() => {
    return [...transactions]
      .filter((tx) => {
        if (filter === 'revenue') return tx.type === 'INCOME';
        if (filter === 'expenses') return tx.type === 'EXPENSE';
        if (filter === 'subscriptions') return tx.sourceType === 'subscription';
        if (filter === 'client') return tx.sourceType === 'client';
        if (filter === 'tools') return tx.categoryId === 'TOOLS';
        if (filter === 'operations') return tx.categoryId === 'OPERATIONS';
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [filter, transactions]);

  const saveEdit = async (formData: FormData) => {
    if (!editing) return;
    const name = String(formData.get('name') || '').trim();
    const amount = Number(formData.get('amount'));
    const notes = String(formData.get('notes') || '').trim();
    const dateValue = String(formData.get('date') || '').trim();

    if (!name || !amount || amount <= 0) {
      setModalError('Name and a positive amount are required.');
      return;
    }

    setIsSaving(true);
    setModalError(null);
    try {
      const payload: Partial<Transaction> = { name, amount, notes };
      if (dateValue) payload.date = toIsoDate(dateValue);
      await updateTransaction(editing.id, payload);
      setEditing(null);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Failed to update transaction');
    } finally {
      setIsSaving(false);
    }
  };

  const saveNew = async (formData: FormData) => {
    const amount = Number(formData.get('amount'));
    const name = String(formData.get('name') || '').trim();
    const notes = String(formData.get('notes') || '').trim();
    const type = String(formData.get('type') || 'EXPENSE') as Transaction['type'];
    const date = String(formData.get('date') || today());
    const categoryId = String(formData.get('categoryId') || (type === 'INCOME' ? 'CLIENT' : 'TOOLS'));

    if (!name || !amount || amount <= 0) {
      setModalError('Name and a positive amount are required.');
      return;
    }

    setIsSaving(true);
    setModalError(null);
    try {
      await addTransaction({
        id: makeId(),
        name,
        amount,
        type,
        status: 'COMPLETED',
        date: toIsoDate(date),
        notes,
        sourceType: 'manual',
        categoryId,
      });
      setAdding(false);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Failed to create transaction');
    } finally {
      setIsSaving(false);
    }
  };

  const requestDelete = (tx: Transaction) => {
    setDeleteError(null);
    setDeleting(tx);
  };

  const closeDeleteModal = () => { if (!isDeleting) setDeleting(null); };

  const confirmDelete = async () => {
    if (!deleting) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteTransaction(deleting.id);
      setDeleting(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete transaction');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-[17px] font-semibold tracking-tight text-textPrimary">Transactions</h1>
            <p className="text-[12px] text-textMuted">Centralized ledger of all financial events</p>
          </div>
          <button type="button" onClick={() => { setModalError(null); setAdding(true); }} className="inline-flex w-full items-center justify-center gap-2 px-3 py-2 rounded-md bg-accent text-white text-[13px] font-medium hover:bg-accent-hover sm:w-auto">
            <Plus size={15} /> Add Transaction
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {filters.map((item) => (
            <button
              key={item.id}
              onClick={() => setFilter(item.id)}
              className={`px-3 py-1.5 rounded-full text-[12px] border transition-all ${
                filter === item.id ? 'bg-accent text-white border-accent' : 'bg-card text-textSecondary border-border hover:bg-slate-100'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="bg-card border border-border rounded-[var(--radius-lg)] overflow-hidden">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-10 text-textMuted">
              <div className="flex justify-center mb-3 text-slate-300"><WalletCards size={34} /></div>
              <p className="text-[13px]">No transactions match this filter yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left border-collapse">
                <thead className="bg-slate-50 border-b border-border">
                  <tr>
                    <th className="p-[10px_14px] text-[11px] font-semibold text-textMuted uppercase tracking-wider">Description / Source</th>
                    <th className="p-[10px_14px] text-[11px] font-semibold text-textMuted uppercase tracking-wider">Category</th>
                    <th className="p-[10px_14px] text-[11px] font-semibold text-textMuted uppercase tracking-wider">Date</th>
                    <th className="p-[10px_14px] text-[11px] font-semibold text-textMuted uppercase tracking-wider">Type</th>
                    <th className="p-[10px_14px] text-[11px] font-semibold text-textMuted uppercase tracking-wider text-right">Amount</th>
                    <th className="p-[10px_14px] text-[11px] font-semibold text-textMuted uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((tx, index) => (
                    <tr key={tx.id} className={`border-b border-slate-50 hover:bg-slate-50 ${index % 2 === 1 ? 'bg-slate-50/50' : ''}`}>
                      <td className="p-[12px_14px] text-[13px] text-textPrimary">
        <div>{tx.name || tx.notes || 'Unnamed Transaction'}</div>
        {tx.notes && tx.notes !== tx.name && <div className="text-[12px] text-textSecondary mt-0.5">{tx.notes}</div>}
                        <div className="text-[11px] text-textMuted uppercase mt-1">{tx.sourceType}</div>
                      </td>
                      <td className="p-[12px_14px] text-[13px] text-textSecondary">
                        <Badge>{tx.categoryId}</Badge>
                      </td>
                      <td className="p-[12px_14px] text-[13px] text-textSecondary">{new Date(tx.date).toLocaleDateString()}</td>
                      <td className="p-[12px_14px] text-[13px] text-textSecondary">
                        <div className="flex items-center gap-2">
                          <Badge tone={tx.type === 'INCOME' ? 'green' : 'red'}>{tx.type === 'INCOME' ? 'Revenue' : 'Expense'}</Badge>
                          {tx.isAuto && <Badge tone="blue">Auto</Badge>}
                          {tx.isEdited && <Badge tone="amber">Edited</Badge>}
                        </div>
                      </td>
                      <td className={`p-[12px_14px] text-[13px] font-mono font-medium text-right ${tx.type === 'INCOME' ? 'text-green-600' : 'text-red-500'}`}>
                        {tx.type === 'INCOME' ? '+' : '-'}{money.format(tx.amount)}
                      </td>
                      <td className="p-[12px_14px] text-right">
                        <div className="flex justify-end gap-2">
                          <button type="button" onClick={() => { setModalError(null); setEditing(tx); }} className="text-textSecondary hover:text-accent p-1 inline-flex" aria-label={`Edit ${tx.name || tx.notes || 'transaction'}`}>
                            <Pencil size={15} />
                          </button>
                          <button type="button" onClick={() => requestDelete(tx)} className="text-red-500 hover:text-red-700 p-1 inline-flex" aria-label={`Delete ${tx.name || tx.notes || 'transaction'}`}>
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 z-[200] bg-slate-900/40 flex items-start sm:items-center justify-center overflow-y-auto p-4" onMouseDown={() => { if (!isSaving) setEditing(null); }}>
          <div className="bg-white rounded-[var(--radius-xl)] border border-border shadow-xl w-full max-w-[460px] max-h-[calc(100vh-2rem)] overflow-y-auto p-5 sm:p-6" onMouseDown={(event) => event.stopPropagation()}>
            <form onSubmit={(event) => { event.preventDefault(); saveEdit(new FormData(event.currentTarget)); }} className="space-y-4">
              <div>
                <h2 className="text-[16px] font-semibold text-textPrimary">Edit Transaction</h2>
                {isAutoTransaction(editing) && (
                  <p className="text-[13px] text-amber-600 mt-1">
                    You are editing this historical payment record only. Future billing settings will not change.
                  </p>
                )}
                {modalError && <p className="text-[13px] text-red-600 mt-2">{modalError}</p>}
              </div>
              <label className="block">
                <span className="block text-[12px] font-medium text-textSecondary mb-1">Transaction Name</span>
                <input name="name" defaultValue={editing.name || editing.notes} className={inputClass} required />
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block">
                  <span className="block text-[12px] font-medium text-textSecondary mb-1">Amount</span>
                  <input name="amount" type="number" min="0" step="0.01" defaultValue={editing.amount} className={inputClass} required />
                </label>
                <label className="block">
                  <span className="block text-[12px] font-medium text-textSecondary mb-1">Date</span>
                  <input name="date" type="date" defaultValue={editing.date ? editing.date.slice(0, 10) : today()} className={inputClass} />
                </label>
              </div>
              <label className="block">
                <span className="block text-[12px] font-medium text-textSecondary mb-1">Notes</span>
                <input name="notes" defaultValue={editing.notes} className={inputClass} />
              </label>
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2 border-t border-border">
                <button type="button" disabled={isSaving} onClick={() => setEditing(null)} className="px-4 py-2 rounded-md border border-border text-[13px] text-textSecondary hover:bg-slate-100 disabled:opacity-60">Cancel</button>
                <button disabled={isSaving} className="px-4 py-2 rounded-md bg-accent text-white text-[13px] font-medium hover:bg-accent-hover disabled:opacity-60">{isSaving ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleting && (
        <div className="fixed inset-0 z-[220] bg-slate-900/40 flex items-start sm:items-center justify-center overflow-y-auto p-4" onMouseDown={closeDeleteModal}>
          <div className="bg-white rounded-[var(--radius-xl)] border border-border shadow-xl w-full max-w-[460px] max-h-[calc(100vh-2rem)] overflow-y-auto p-5 sm:p-6" onMouseDown={(event) => event.stopPropagation()}>
            <h2 className="text-[16px] font-semibold text-textPrimary">Delete this transaction?</h2>
            <p className="text-[13px] text-textSecondary mt-2">
              {isAutoTransaction(deleting)
                ? 'This will delete this payment record only. It will not delete the client/subscription.'
                : 'This will remove the manual transaction from your ledger.'}
            </p>
            <div className="mt-4 rounded-md bg-slate-50 border border-slate-100 p-3 text-[13px] text-textSecondary">
              <div className="font-medium text-textPrimary">{deleting.name || deleting.notes || 'Untitled transaction'}</div>
              <div className="mt-1">{new Date(deleting.date).toLocaleDateString()} · {deleting.type === 'INCOME' ? '+' : '-'}{money.format(deleting.amount)}</div>
            </div>
            {deleteError && <p className="text-[13px] text-red-600 mt-3">{deleteError}</p>}
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-5 mt-5 border-t border-border">
              <button type="button" disabled={isDeleting} onClick={closeDeleteModal} className="px-4 py-2 rounded-md border border-border text-[13px] text-textSecondary hover:bg-slate-100 disabled:opacity-60">Cancel</button>
              <button type="button" disabled={isDeleting} onClick={confirmDelete} className="px-4 py-2 rounded-md bg-red-600 text-white text-[13px] font-medium hover:bg-red-700 disabled:opacity-60">{isDeleting ? 'Deleting...' : 'Delete Transaction'}</button>
            </div>
          </div>
        </div>
      )}

      {adding && (
        <div className="fixed inset-0 z-[200] bg-slate-900/40 flex items-start sm:items-center justify-center overflow-y-auto p-4" onMouseDown={() => { if (!isSaving) setAdding(false); }}>
          <div className="bg-white rounded-[var(--radius-xl)] border border-border shadow-xl w-full max-w-[460px] max-h-[calc(100vh-2rem)] overflow-y-auto p-5 sm:p-6" onMouseDown={(event) => event.stopPropagation()}>
            <form onSubmit={(event) => { event.preventDefault(); saveNew(new FormData(event.currentTarget)); }} className="space-y-4">
              <div>
                <h2 className="text-[16px] font-semibold text-textPrimary">Add Transaction</h2>
                <p className="text-[13px] text-textMuted mt-1">Manual entries appear immediately after the API confirms them.</p>
                {modalError && <p className="text-[13px] text-red-600 mt-2">{modalError}</p>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block">
                  <span className="block text-[12px] font-medium text-textSecondary mb-1">Transaction Name</span>
                  <input name="name" className={inputClass} required />
                </label>
                <label className="block">
                  <span className="block text-[12px] font-medium text-textSecondary mb-1">Type</span>
                  <select name="type" className={inputClass} defaultValue="EXPENSE">
                    <option value="INCOME">Revenue</option>
                    <option value="EXPENSE">Expense</option>
                  </select>
                </label>
                <label className="block">
                  <span className="block text-[12px] font-medium text-textSecondary mb-1">Amount</span>
                  <input name="amount" type="number" min="0" step="0.01" className={inputClass} required />
                </label>
              </div>
              <label className="block">
                <span className="block text-[12px] font-medium text-textSecondary mb-1">Notes</span>
                <input name="notes" className={inputClass} placeholder="Optional" />
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block">
                  <span className="block text-[12px] font-medium text-textSecondary mb-1">Date</span>
                  <input name="date" type="date" defaultValue={today()} className={inputClass} required />
                </label>
                <label className="block">
                  <span className="block text-[12px] font-medium text-textSecondary mb-1">Category</span>
                  <select name="categoryId" className={inputClass} defaultValue="TOOLS">
                    <option value="CLIENT">Client Payment</option>
                    <option value="PROJECT">Project Revenue</option>
                    <option value="TOOLS">Tools</option>
                    <option value="OPERATIONS">Operations</option>
                    <option value="TAXES">Taxes</option>
                    <option value="OTHER">Other</option>
                  </select>
                </label>
              </div>
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2 border-t border-border">
                <button type="button" disabled={isSaving} onClick={() => setAdding(false)} className="px-4 py-2 rounded-md border border-border text-[13px] text-textSecondary hover:bg-slate-100 disabled:opacity-60">Cancel</button>
                <button disabled={isSaving} className="px-4 py-2 rounded-md bg-accent text-white text-[13px] font-medium hover:bg-accent-hover disabled:opacity-60">{isSaving ? 'Saving...' : 'Save Transaction'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function Badge({ children, tone = 'slate' }: { children: React.ReactNode; tone?: 'blue' | 'green' | 'red' | 'amber' | 'slate' }) {
  const classes = {
    blue: 'bg-blue-50 text-accent',
    green: 'bg-green-50 text-green-700',
    red: 'bg-red-50 text-red-600',
    amber: 'bg-amber-50 text-amber-600',
    slate: 'bg-slate-100 text-textSecondary',
  };
  return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${classes[tone]}`}>{children}</span>;
}
