'use client';

import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useFinancialStore } from '@/store/financialStore';
import { Transaction } from '@/types/finance';
import { Button } from '@/components/ui/Button';
import { Input, Select, Field } from '@/components/ui/Form';

const pageCopy: Record<string, { title: string; subtitle: string }> = {
  '/': { title: 'Overview', subtitle: 'Your financial snapshot at a glance' },
  '/transactions': { title: 'Transactions', subtitle: 'Every dollar in and out' },
  '/subscriptions': { title: 'Subscriptions', subtitle: 'Recurring tools and software' },
  '/clients': { title: 'Clients & Revenue', subtitle: 'Who pays you, and how much' },
  '/analytics': { title: 'Analytics', subtitle: 'Trends across periods' },
  '/archive': { title: 'Archive', subtitle: 'Restore past clients and tools' },
  '/settings': { title: 'Settings', subtitle: 'Account and workspace' },
};

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
    const name = String(formData.get('name') || '').trim();
    const notes = String(formData.get('notes') || '').trim();
    const type = String(formData.get('type') || 'INCOME') as Transaction['type'];
    const date = String(formData.get('date') || today());
    const categoryId = String(formData.get('categoryId') || (type === 'INCOME' ? 'CLIENT' : 'TOOLS'));

    if (!name || !amount || amount <= 0) return;

    setIsSaving(true);
    setError(null);
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
      setIsOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create transaction');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <header className="h-[var(--header-h)] shrink-0 border-b border-border bg-surface flex items-center gap-[14px] px-5 sticky top-0 z-40">
        <div className="min-w-0">
          <h1 className="t-h2 truncate">{copy.title}</h1>
          <p className="hidden sm:block t-small text-text-muted truncate">{copy.subtitle}</p>
        </div>
        <div className="flex-1" />

        <Button onClick={openModal} icon="plus" size="md">
          New Transaction
        </Button>
      </header>

      {isOpen && (
        <div className="fixed inset-0 z-[200] bg-slate-900/40 flex items-start sm:items-center justify-center overflow-y-auto p-4 backdrop-blur-sm" onMouseDown={() => { if (!isSaving) setIsOpen(false); }}>
          <div className="bg-surface-elevated rounded-[var(--r-xl)] border border-border shadow-lg w-full max-w-[460px] max-h-[calc(100vh-2rem)] overflow-y-auto p-5 sm:p-6 anim-rise" onMouseDown={(event) => event.stopPropagation()}>
            <form onSubmit={(event) => { event.preventDefault(); saveTransaction(new FormData(event.currentTarget)); }} className="flex flex-col gap-4">
              <div>
                <h2 className="text-[16px] font-semibold text-text">New Transaction</h2>
                <p className="text-[13px] text-text-muted mt-1">Create a manual revenue or expense entry.</p>
                {error && <p className="text-[13px] text-negative mt-2">{error}</p>}
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Type">
                  <Select name="type" defaultValue="INCOME">
                    <option value="INCOME">Revenue</option>
                    <option value="EXPENSE">Expense</option>
                  </Select>
                </Field>
                <Field label="Amount">
                  <Input name="amount" type="number" min="0" step="0.01" required />
                </Field>
              </div>
              
              <Field label="Transaction Name">
                <Input name="name" required />
              </Field>
              
              <Field label="Notes">
                <Input name="notes" placeholder="Optional" />
              </Field>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Date">
                  <Input name="date" type="date" defaultValue={today()} required />
                </Field>
                <Field label="Category">
                  <Select name="categoryId" defaultValue="CLIENT">
                    <option value="CLIENT">Client Payment</option>
                    <option value="PROJECT">Project Revenue</option>
                    <option value="TOOLS">Tools</option>
                    <option value="OPERATIONS">Operations</option>
                    <option value="TAXES">Taxes</option>
                    <option value="OTHER">Other</option>
                  </Select>
                </Field>
              </div>
              
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4 mt-2 border-t border-border">
                <Button type="button" variant="secondary" disabled={isSaving} onClick={() => setIsOpen(false)}>Cancel</Button>
                <Button type="submit" loading={isSaving}>Save Transaction</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
