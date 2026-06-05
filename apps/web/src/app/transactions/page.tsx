'use client';

import { useEffect, useMemo, useState } from 'react';
import { useFinancialStore } from '@/store/useFinancialStore';
import { Transaction } from '@/types/finance';
import { makeCurrencyFormatter } from '@/lib/currency';
import { formatDate as formatLocaleDate } from '@/lib/format';
import { useLocale } from '@/lib/i18n';
import type { Locale } from '@/lib/locales';
import { Button, IconButton } from '@/components/ui/Button';
import { Badge, FilterChip } from '@/components/ui/Badge';
import { Card, SectionHeader, StatCard } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Field, Input, Select, Textarea } from '@/components/ui/Form';
import { Icon } from '@/components/ui/Icon';
import { InlineAlert } from '@/components/ui/InlineAlert';

type Filter = 'all' | 'revenue' | 'expenses' | 'subscriptions' | 'client' | 'tools' | 'operations';
type CurrencyFormatter = ReturnType<typeof makeCurrencyFormatter>;

const filters: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'revenue', label: 'Revenue' },
  { id: 'expenses', label: 'Expenses' },
  { id: 'subscriptions', label: 'Subscriptions' },
  { id: 'client', label: 'Client' },
  { id: 'tools', label: 'Tools' },
  { id: 'operations', label: 'Operations' },
];

const today = () => new Date().toISOString().slice(0, 10);

function toIsoDate(date: string) {
  return new Date(`${date}T12:00:00`).toISOString();
}

const makeId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const isAutoTransaction = (tx: Transaction) => Boolean(tx.isAuto) || tx.sourceType !== 'manual';

function matchesFilter(tx: Transaction, filter: Filter) {
  if (filter === 'revenue') return tx.type === 'INCOME';
  if (filter === 'expenses') return tx.type === 'EXPENSE';
  if (filter === 'subscriptions') return tx.sourceType === 'subscription';
  if (filter === 'client') return tx.sourceType === 'client';
  if (filter === 'tools') return tx.categoryId === 'TOOLS';
  if (filter === 'operations') return tx.categoryId === 'OPERATIONS';
  return true;
}

function titleCase(value: string) {
  return value.toLowerCase().replace(/(^|[_\s-])\w/g, (match) => match.toUpperCase()).replace(/_/g, ' ');
}

function transactionTitle(tx: Transaction) {
  return tx.name || tx.notes || 'Unnamed transaction';
}

function sourceLabel(tx: Transaction) {
  if (tx.sourceType === 'client') return 'Client payment';
  if (tx.sourceType === 'subscription') return 'Subscription';
  return 'Manual entry';
}

function formatTransactionDate(value: string, locale: Locale) {
  return formatLocaleDate(value, locale, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function TransactionsPage() {
  const { transactions, currency, addTransaction, updateTransaction, deleteTransaction } = useFinancialStore();
  const { locale } = useLocale();
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState<Transaction | null>(null);
  const [adding, setAdding] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const money = useMemo(() => makeCurrencyFormatter(currency, { minimumFractionDigits: 2 }, locale), [currency, locale]);
  const money0 = useMemo(() => makeCurrencyFormatter(currency, { maximumFractionDigits: 0 }, locale), [currency, locale]);
  const currencyPrefix = useMemo(() => money.formatToParts(0).find((part) => part.type === 'currency')?.value || currency, [currency, money]);

  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get('filter') as Filter | null;
    if (param && filters.some((item) => item.id === param)) setFilter(param);
  }, []);

  const filteredTransactions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return [...transactions]
      .filter((tx) => matchesFilter(tx, filter))
      .filter((tx) => {
        if (!normalizedQuery) return true;
        return [tx.name, tx.notes, tx.categoryId, tx.sourceType, tx.type, tx.amount.toString()]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery);
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [filter, query, transactions]);

  const filterCounts = useMemo(() => {
    return filters.reduce<Record<Filter, number>>((acc, item) => {
      acc[item.id] = transactions.filter((tx) => matchesFilter(tx, item.id)).length;
      return acc;
    }, {} as Record<Filter, number>);
  }, [transactions]);

  const ledgerStats = useMemo(() => {
    return transactions.reduce(
      (acc, tx) => {
        if (tx.type === 'INCOME') acc.revenue += tx.amount;
        if (tx.type === 'EXPENSE') acc.expenses += tx.amount;
        if (tx.sourceType === 'manual') acc.manual += 1;
        if (isAutoTransaction(tx)) acc.generated += 1;
        return acc;
      },
      { revenue: 0, expenses: 0, manual: 0, generated: 0 },
    );
  }, [transactions]);

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

  const openAddModal = () => {
    setModalError(null);
    setAdding(true);
  };

  const openEditModal = (tx: Transaction) => {
    setModalError(null);
    setEditing(tx);
  };

  return (
    <>
      <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-10">
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h1 className="t-h1">Transactions</h1>
            <p className="t-body mt-1 text-text-muted">Centralized ledger of all financial events</p>
          </div>
          <Button icon="Plus" onClick={openAddModal} className="w-full sm:w-auto">Add transaction</Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Revenue" value={money0.format(ledgerStats.revenue)} tone="positive" icon="TrendingUp" />
          <StatCard label="Expenses" value={money0.format(ledgerStats.expenses)} tone="negative" icon="Receipt" />
          <StatCard label="Manual entries" value={ledgerStats.manual} icon="Pencil" />
          <StatCard label="Generated entries" value={ledgerStats.generated} icon="RefreshCw" />
        </div>

        <div className="flex flex-wrap gap-2">
          {filters.map((item) => (
            <FilterChip key={item.id} active={filter === item.id} count={filterCounts[item.id]} onClick={() => setFilter(item.id)}>
              {item.label}
            </FilterChip>
          ))}
        </div>

        <Card pad={0}>
          <div className="p-4 border-b border-border flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <SectionHeader
              title="Ledger"
              sub={`${filteredTransactions.length} transaction${filteredTransactions.length !== 1 ? 's' : ''} shown`}
              className="mb-0"
            />
            <div className="w-full lg:w-[320px]">
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search transactions"
                prefix={<Icon name="Search" size={15} />}
              />
            </div>
          </div>

          {filteredTransactions.length === 0 ? (
            <EmptyState
              icon="WalletCards"
              title="No transactions found"
              body={query ? 'Try a different search or clear the current filter.' : 'When you add revenue or expenses, they will show up here.'}
              action={<Button icon="Plus" onClick={openAddModal}>Add transaction</Button>}
            />
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[760px] text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-surface">
                      <TableHead>Description</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead align="right">Amount</TableHead>
                      <TableHead align="right">Actions</TableHead>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((tx) => (
                      <TransactionRow
                        key={tx.id}
                        transaction={tx}
                        money={money}
                        locale={locale}
                        onEdit={openEditModal}
                        onDelete={requestDelete}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-border md:hidden">
                {filteredTransactions.map((tx) => (
                  <TransactionCard
                    key={tx.id}
                    transaction={tx}
                    money={money}
                    locale={locale}
                    onEdit={openEditModal}
                    onDelete={requestDelete}
                  />
                ))}
              </div>

              <div className="px-4 py-3 border-t border-border flex items-center justify-between text-sm text-text-muted">
                <span>{filteredTransactions.length} shown</span>
                {query && (
                  <button type="button" onClick={() => setQuery('')} className="font-medium text-accent hover:underline">
                    Clear search
                  </button>
                )}
              </div>
            </>
          )}
        </Card>
      </div>

      {editing && (
        <ModalFrame onClose={() => { if (!isSaving) setEditing(null); }}>
          <TransactionForm
            mode="edit"
            transaction={editing}
            currencyPrefix={currencyPrefix}
            error={modalError}
            isSaving={isSaving}
            onCancel={() => setEditing(null)}
            onSave={saveEdit}
          />
        </ModalFrame>
      )}

      {deleting && (
        <ModalFrame onClose={closeDeleteModal} zIndex="z-[220]">
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-negative-tint text-negative flex items-center justify-center shrink-0">
                <Icon name="AlertTriangle" size={20} />
              </div>
              <div>
                <h2 className="t-h3">Delete this transaction?</h2>
                <p className="text-sm text-text-secondary mt-1">
                  {isAutoTransaction(deleting)
                    ? 'This will delete this payment record only. It will not delete the client or subscription.'
                    : 'This will remove the manual transaction from your ledger.'}
                </p>
              </div>
            </div>
            <div className="rounded-md bg-surface-hover border border-border p-3 text-sm">
              <div className="font-medium text-text">{transactionTitle(deleting)}</div>
              <div className="mt-1 text-text-muted">{formatTransactionDate(deleting.date, locale)} - {deleting.type === 'INCOME' ? '+' : '-'}{money.format(deleting.amount)}</div>
            </div>
            {deleteError && <InlineAlert tone="negative">{deleteError}</InlineAlert>}
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2 border-t border-border">
              <Button type="button" variant="ghost" disabled={isDeleting} onClick={closeDeleteModal}>Cancel</Button>
              <Button type="button" variant="destructive" loading={isDeleting} onClick={confirmDelete}>{isDeleting ? 'Deleting...' : 'Delete transaction'}</Button>
            </div>
          </div>
        </ModalFrame>
      )}

      {adding && (
        <ModalFrame onClose={() => { if (!isSaving) setAdding(false); }}>
          <TransactionForm
            mode="add"
            currencyPrefix={currencyPrefix}
            error={modalError}
            isSaving={isSaving}
            onCancel={() => setAdding(false)}
            onSave={saveNew}
          />
        </ModalFrame>
      )}
    </>
  );
}

function TableHead({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'right' }) {
  return (
    <th className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted ${align === 'right' ? 'text-right' : 'text-left'}`}>
      {children}
    </th>
  );
}

function TransactionRow({ transaction, money, locale, onEdit, onDelete }: { transaction: Transaction; money: CurrencyFormatter; locale: Locale; onEdit: (tx: Transaction) => void; onDelete: (tx: Transaction) => void }) {
  return (
    <tr className="border-b border-border last:border-b-0 hover:bg-surface-hover transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-start gap-3">
          <TransactionIcon type={transaction.type} />
          <div className="min-w-0">
            <div className="t-body-m truncate">{transactionTitle(transaction)}</div>
            {transaction.notes && transaction.notes !== transaction.name && <div className="text-xs text-text-muted mt-0.5 truncate max-w-[320px]">{transaction.notes}</div>}
            <div className="text-xs text-text-muted mt-1">{sourceLabel(transaction)}</div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3"><Badge>{titleCase(transaction.categoryId)}</Badge></td>
      <td className="px-4 py-3 text-sm text-text-secondary font-mono">{formatTransactionDate(transaction.date, locale)}</td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone={transaction.type === 'INCOME' ? 'positive' : 'negative'}>{transaction.type === 'INCOME' ? 'Revenue' : 'Expense'}</Badge>
          {isAutoTransaction(transaction) && <Badge tone="neutral" icon="RefreshCw">Auto</Badge>}
          {transaction.isEdited && <Badge tone="warning" icon="Pencil">Edited</Badge>}
        </div>
      </td>
      <td className={`px-4 py-3 text-right font-mono text-sm font-medium ${transaction.type === 'INCOME' ? 'text-positive' : 'text-negative'}`}>
        {transaction.type === 'INCOME' ? '+' : '-'}{money.format(transaction.amount)}
      </td>
      <td className="px-4 py-3">
        <div className="flex justify-end gap-1">
          <IconButton icon="Pencil" size="sm" title={`Edit ${transactionTitle(transaction)}`} onClick={() => onEdit(transaction)} />
          <IconButton icon="Trash2" size="sm" title={`Delete ${transactionTitle(transaction)}`} className="text-negative hover:text-negative" onClick={() => onDelete(transaction)} />
        </div>
      </td>
    </tr>
  );
}

function TransactionCard({ transaction, money, locale, onEdit, onDelete }: { transaction: Transaction; money: CurrencyFormatter; locale: Locale; onEdit: (tx: Transaction) => void; onDelete: (tx: Transaction) => void }) {
  return (
    <div className="p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <TransactionIcon type={transaction.type} />
          <div className="min-w-0">
            <div className="t-body-m truncate">{transactionTitle(transaction)}</div>
            <div className="text-xs text-text-muted mt-0.5">{formatTransactionDate(transaction.date, locale)} - {sourceLabel(transaction)}</div>
          </div>
        </div>
        <div className={`font-mono text-sm font-medium shrink-0 ${transaction.type === 'INCOME' ? 'text-positive' : 'text-negative'}`}>
          {transaction.type === 'INCOME' ? '+' : '-'}{money.format(transaction.amount)}
        </div>
      </div>
      {transaction.notes && transaction.notes !== transaction.name && <div className="text-sm text-text-secondary">{transaction.notes}</div>}
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          <Badge>{titleCase(transaction.categoryId)}</Badge>
          <Badge tone={transaction.type === 'INCOME' ? 'positive' : 'negative'}>{transaction.type === 'INCOME' ? 'Revenue' : 'Expense'}</Badge>
          {isAutoTransaction(transaction) && <Badge tone="neutral" icon="RefreshCw">Auto</Badge>}
          {transaction.isEdited && <Badge tone="warning" icon="Pencil">Edited</Badge>}
        </div>
        <div className="flex gap-1 shrink-0">
          <IconButton icon="Pencil" size="sm" title={`Edit ${transactionTitle(transaction)}`} onClick={() => onEdit(transaction)} />
          <IconButton icon="Trash2" size="sm" title={`Delete ${transactionTitle(transaction)}`} className="text-negative hover:text-negative" onClick={() => onDelete(transaction)} />
        </div>
      </div>
    </div>
  );
}

function TransactionIcon({ type }: { type: Transaction['type'] }) {
  return (
    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${type === 'INCOME' ? 'bg-positive-tint text-positive' : 'bg-negative-tint text-negative'}`}>
      <Icon name={type === 'INCOME' ? 'ArrowDown' : 'ArrowUp'} size={16} strokeWidth={2.2} />
    </div>
  );
}

function ModalFrame({ children, onClose, zIndex = 'z-[200]' }: { children: React.ReactNode; onClose: () => void; zIndex?: string }) {
  return (
    <div className={`fixed inset-0 ${zIndex} bg-black/40 backdrop-blur-sm flex items-start sm:items-center justify-center p-4 overflow-y-auto`} onMouseDown={onClose}>
      <Card
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md my-8 relative shadow-xl"
        pad={24}
        onMouseDown={(event) => event.stopPropagation()}
      >
        {children}
      </Card>
    </div>
  );
}

function TransactionForm({ mode, transaction, currencyPrefix, error, isSaving, onCancel, onSave }: { mode: 'add' | 'edit'; transaction?: Transaction; currencyPrefix: string; error: string | null; isSaving: boolean; onCancel: () => void; onSave: (formData: FormData) => void }) {
  const isEdit = mode === 'edit';
  const isAuto = transaction ? isAutoTransaction(transaction) : false;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSave(new FormData(event.currentTarget));
      }}
      className="flex flex-col gap-4"
    >
      <div>
        <h2 className="t-h3">{isEdit ? 'Edit transaction' : 'Add transaction'}</h2>
        <p className="text-sm text-text-muted mt-1">
          {isEdit ? 'Update this ledger record without changing future recurring settings.' : 'Manual entries appear after the API confirms them.'}
        </p>
      </div>

      {isAuto && (
        <InlineAlert tone="warning">
          You are editing this historical payment record only. Future billing settings will not change.
        </InlineAlert>
      )}

      {error && <InlineAlert tone="negative">{error}</InlineAlert>}

      <Field label="Transaction name">
        <Input name="name" defaultValue={transaction?.name || transaction?.notes || ''} placeholder="Website design project" required autoFocus />
      </Field>

      {!isEdit && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Type">
            <Select name="type" defaultValue="EXPENSE">
              <option value="INCOME">Revenue</option>
              <option value="EXPENSE">Expense</option>
            </Select>
          </Field>
          <Field label="Category">
            <Select name="categoryId" defaultValue="TOOLS">
              <option value="CLIENT">Client Payment</option>
              <option value="PROJECT">Project Revenue</option>
              <option value="TOOLS">Tools</option>
              <option value="OPERATIONS">Operations</option>
              <option value="TAXES">Taxes</option>
              <option value="OTHER">Other</option>
            </Select>
          </Field>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Amount">
          <Input name="amount" type="number" min="0" step="0.01" defaultValue={transaction?.amount} required prefix={currencyPrefix} />
        </Field>
        <Field label="Date">
          <Input name="date" type="date" defaultValue={transaction?.date ? transaction.date.slice(0, 10) : today()} required={!isEdit} />
        </Field>
      </div>

      <Field label="Notes" hint="Optional">
        <Textarea name="notes" defaultValue={transaction?.notes || ''} placeholder="Add context" />
      </Field>

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2 border-t border-border">
        <Button type="button" variant="ghost" disabled={isSaving} onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={isSaving}>{isSaving ? 'Saving...' : isEdit ? 'Save changes' : 'Save transaction'}</Button>
      </div>
    </form>
  );
}
