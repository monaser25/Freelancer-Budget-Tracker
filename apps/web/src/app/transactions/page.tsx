'use client';

import { useEffect, useMemo, useState } from 'react';
import { useFinancialStore } from '@/store/useFinancialStore';
import { Transaction } from '@/types/finance';
import { Pencil, Trash2, WalletCards } from 'lucide-react';

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

export default function TransactionsPage() {
  const { transactions, updateTransaction, deleteTransaction } = useFinancialStore();
  const [filter, setFilter] = useState<Filter>('all');
  const [editing, setEditing] = useState<Transaction | null>(null);

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

  const saveEdit = (formData: FormData) => {
    if (!editing) return;
    const amount = Number(formData.get('amount'));
    const notes = String(formData.get('notes') || '').trim();
    if (!amount || amount <= 0) return;
    updateTransaction(editing.id, { amount, notes });
    setEditing(null);
  };

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-[17px] font-semibold tracking-tight text-textPrimary">Transactions</h1>
          <p className="text-[12px] text-textMuted">Centralized ledger of all financial events</p>
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
            <table className="w-full text-left border-collapse">
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
                      <div>{tx.notes || 'Unnamed Transaction'}</div>
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
                      {tx.type === 'INCOME' ? '+' : '-'}${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-[12px_14px] text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setEditing(tx)} className="text-textSecondary hover:text-accent p-1 inline-flex" aria-label={`Edit ${tx.notes || 'transaction'}`}>
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => deleteTransaction(tx.id)} className="text-red-500 hover:text-red-700 p-1 inline-flex" aria-label={`Delete ${tx.notes || 'transaction'}`}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 z-[200] bg-slate-900/40 flex items-center justify-center p-4" onMouseDown={() => setEditing(null)}>
          <div className="bg-white rounded-[var(--radius-xl)] border border-border shadow-xl w-full max-w-[460px] p-6" onMouseDown={(event) => event.stopPropagation()}>
            <form onSubmit={(event) => { event.preventDefault(); saveEdit(new FormData(event.currentTarget)); }} className="space-y-4">
              <div>
                <h2 className="text-[16px] font-semibold text-textPrimary">Edit Transaction</h2>
                {editing.isAuto && <p className="text-[13px] text-amber-600 mt-1">This is an auto-generated transaction. Future auto-transactions still use the original client/subscription amount.</p>}
              </div>
              <label className="block">
                <span className="block text-[12px] font-medium text-textSecondary mb-1">Amount</span>
                <input name="amount" type="number" min="0" step="0.01" defaultValue={editing.amount} className={inputClass} required />
              </label>
              <label className="block">
                <span className="block text-[12px] font-medium text-textSecondary mb-1">Notes</span>
                <input name="notes" defaultValue={editing.notes} className={inputClass} />
              </label>
              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 rounded-md border border-border text-[13px] text-textSecondary hover:bg-slate-100">Cancel</button>
                <button className="px-4 py-2 rounded-md bg-accent text-white text-[13px] font-medium hover:bg-accent-hover">Save Changes</button>
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
