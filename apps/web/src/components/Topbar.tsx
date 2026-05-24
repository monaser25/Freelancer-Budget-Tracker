'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useFinancialStore } from '@/store/useFinancialStore';
import { Transaction } from '@/types/finance';

const pageCopy: Record<string, { title: string; subtitle: string }> = {
  '/': { title: 'Overview', subtitle: 'Your financial snapshot at a glance' },
  '/transactions': { title: 'Transactions', subtitle: 'All your income and expense entries' },
  '/subscriptions': { title: 'Subscriptions', subtitle: 'Recurring tools and client retainers' },
  '/clients': { title: 'Clients & Revenue', subtitle: 'Manage your clients and track income' },
  '/analytics': { title: 'Analytics', subtitle: 'In-depth financial analysis' },
  '/settings': { title: 'Preferences', subtitle: 'Tune the workspace for your freelance finances' },
};

const inputClass = 'w-full px-3 py-2 border border-border rounded-md text-[13px] outline-none focus:border-accent bg-background';
const today = () => new Date().toISOString().slice(0, 10);

const makeId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const toIsoDate = (date: string) => new Date(`${date}T12:00:00`).toISOString();

export function Topbar() {
  const pathname = usePathname();
  const copy = pageCopy[pathname] || pageCopy['/'];
  const { addTransaction } = useFinancialStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openModal = () => {
    setError(null);
    setIsOpen(true);
  };

  const saveTransaction = async (formData: FormData) => {
    const amount = Number(formData.get('amount'));
    const notes = String(formData.get('notes') || '').trim();
    const type = String(formData.get('type') || 'INCOME') as Transaction['type'];
    const date = String(formData.get('date') || today());
    const categoryId = String(formData.get('categoryId') || (type === 'INCOME' ? 'CLIENT' : 'TOOLS'));

    if (!amount || amount <= 0) return;

    setIsSaving(true);
    setError(null);
    try {
      await addTransaction({
        id: makeId(),
        amount,
        type,
        status: 'COMPLETED',
        date: toIsoDate(date),
        notes,
        sourceType: 'manual',
        categoryId,
      });
      setIsOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create transaction');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="h-[var(--header-h)] bg-sidebar border-b border-border flex items-center justify-between px-7 sticky top-0 z-50">
        <div className="flex flex-col">
          <h1 className="text-[17px] font-semibold tracking-tight text-textPrimary">{copy.title}</h1>
          <p className="text-[12px] text-textMuted">{copy.subtitle}</p>
        </div>
        <div className="flex items-center gap-[10px]">
          <Link href="/transactions" className="inline-flex items-center gap-[6px] px-[14px] py-[8px] rounded-md text-[13px] font-medium cursor-pointer border border-border bg-transparent text-textSecondary hover:bg-slate-100 hover:text-textPrimary transition-all">
            View Ledger
          </Link>
          <button type="button" onClick={openModal} className="inline-flex items-center gap-[6px] px-[14px] py-[8px] rounded-md text-[13px] font-medium cursor-pointer border-none bg-accent text-white hover:bg-accent-hover transition-all">
            <Plus size={15} /> New Transaction
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-[200] bg-slate-900/40 flex items-center justify-center p-4" onMouseDown={() => { if (!isSaving) setIsOpen(false); }}>
          <div className="bg-white rounded-[var(--radius-xl)] border border-border shadow-xl w-full max-w-[460px] p-6" onMouseDown={(event) => event.stopPropagation()}>
            <form onSubmit={(event) => { event.preventDefault(); saveTransaction(new FormData(event.currentTarget)); }} className="space-y-4">
              <div>
                <h2 className="text-[16px] font-semibold text-textPrimary">New Transaction</h2>
                <p className="text-[13px] text-textMuted mt-1">Create a manual revenue or expense entry.</p>
                {error && <p className="text-[13px] text-red-600 mt-2">{error}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="block text-[12px] font-medium text-textSecondary mb-1">Type</span>
                  <select name="type" className={inputClass} defaultValue="INCOME">
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
                <span className="block text-[12px] font-medium text-textSecondary mb-1">Description</span>
                <input name="notes" className={inputClass} required />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="block text-[12px] font-medium text-textSecondary mb-1">Date</span>
                  <input name="date" type="date" defaultValue={today()} className={inputClass} required />
                </label>
                <label className="block">
                  <span className="block text-[12px] font-medium text-textSecondary mb-1">Category</span>
                  <select name="categoryId" className={inputClass} defaultValue="CLIENT">
                    <option value="CLIENT">Client Payment</option>
                    <option value="PROJECT">Project Revenue</option>
                    <option value="TOOLS">Tools</option>
                    <option value="OPERATIONS">Operations</option>
                    <option value="TAXES">Taxes</option>
                    <option value="OTHER">Other</option>
                  </select>
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button type="button" disabled={isSaving} onClick={() => setIsOpen(false)} className="px-4 py-2 rounded-md border border-border text-[13px] text-textSecondary hover:bg-slate-100 disabled:opacity-60">Cancel</button>
                <button disabled={isSaving} className="px-4 py-2 rounded-md bg-accent text-white text-[13px] font-medium hover:bg-accent-hover disabled:opacity-60">{isSaving ? 'Saving...' : 'Save Transaction'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
