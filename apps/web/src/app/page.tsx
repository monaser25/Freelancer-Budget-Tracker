'use client';

import { useFinancialStore } from '@/store/useFinancialStore';
import { Transaction } from '@/types/finance';
import { makeCurrencyFormatter } from '@/lib/currency';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDownCircle,
  CreditCard,
  Inbox,
  PlusCircle,
  RefreshCw,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
  UserPlus,
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

type ModalType = 'income' | 'expense' | null;
type MonthlyChartRow = {
  key: string;
  month: string;
  revenue: number;
  expenses: number;
};

const makeId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const today = () => new Date().toISOString().slice(0, 10);

function toIsoDate(date: string) {
  return new Date(`${date}T12:00:00`).toISOString();
}

export default function DashboardPage() {
  const router = useRouter();
  const {
    transactions,
    subscriptions,
    overview,
    currency,
    error,
    addTransaction,
  } = useFinancialStore();
  const [modal, setModal] = useState<ModalType>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const money = useMemo(() => makeCurrencyFormatter(currency, { maximumFractionDigits: 0 }), [currency]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'transaction') {
      setModal('income');
      window.history.replaceState(null, '', '/');
    }
  }, []);

  const chartData = useMemo(() => {
    const labels: MonthlyChartRow[] = [];
    const now = new Date();

    for (let i = 5; i >= 0; i -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      labels.push({
        key,
        month: date.toLocaleString('en-US', { month: 'short' }),
        revenue: 0,
        expenses: 0,
      });
    }

    transactions.forEach((tx) => {
      if (tx.status !== 'COMPLETED') return;
      const key = tx.date.slice(0, 7);
      const bucket = labels.find((item) => item.key === key);
      if (!bucket) return;
      if (tx.type === 'INCOME') bucket.revenue += tx.amount;
      if (tx.type === 'EXPENSE') bucket.expenses += tx.amount;
    });

    return labels;
  }, [transactions]);

  const recentTransactions = useMemo(
    () => [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5),
    [transactions],
  );

  const saveTransaction = async (formData: FormData, type: 'INCOME' | 'EXPENSE') => {
    const amount = Number(formData.get('amount'));
    const notes = String(formData.get('notes') || '').trim();
    const date = String(formData.get('date') || today());
    const categoryId = String(formData.get('categoryId') || (type === 'INCOME' ? 'CLIENT' : 'TOOLS'));

    if (!amount || amount <= 0) return;

    const tx: Transaction = {
      id: makeId(),
      amount,
      type,
      status: 'COMPLETED',
      date: toIsoDate(date),
      notes,
      sourceType: 'manual',
      categoryId,
    };

    setIsSaving(true);
    setModalError(null);
    try {
      await addTransaction(tx);
      setModal(null);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Failed to create transaction');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-md text-sm flex items-center gap-2">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-[14px]">
        <StatCard href="/clients" label="Total Clients" value={String(overview.activeClients || overview.totalClients)} icon={<Users size={14} />} detail={`${overview.totalClients} total records`} />
        <StatCard href="/transactions?filter=revenue" label="Total Revenue" value={money.format(overview.totalRevenue)} icon={<TrendingUp size={14} />} detail={`This month: ${money.format(overview.monthlyRevenue)}`} tone="green" />
        <StatCard href="/transactions?filter=expenses" label="Total Expenses" value={money.format(overview.totalExpenses)} icon={<TrendingDown size={14} />} detail="Global tracked" tone="red" />
        <StatCard href="/analytics" label="Net Profit" value={money.format(overview.netProfit)} icon={<Target size={14} />} detail="Revenue - costs" />
        <StatCard href="/subscriptions" label="Active Subscriptions" value={`${money.format(overview.subscriptionBurden)}/mo`} icon={<RefreshCw size={14} />} detail={`${overview.activeSubscriptionsCount} active`} />
      </div>

      <div>
        <div className="text-[13px] font-semibold text-textSecondary mb-[10px]">Quick Actions</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-[10px]">
          <ActionButton icon={<PlusCircle size={18} />} label="Add Revenue" onClick={() => { setModalError(null); setModal('income'); }} />
          <ActionButton icon={<ArrowDownCircle size={18} />} label="Log Expense" onClick={() => { setModalError(null); setModal('expense'); }} />
          <ActionButton icon={<CreditCard size={18} />} label="Add Subscription" href="/subscriptions?action=tool" />
          <ActionButton icon={<UserPlus size={18} />} label="Add Client" href="/clients?action=client" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-[14px]">
        <div className="lg:col-span-2 space-y-[14px]">
          <div className="bg-card border border-border rounded-[var(--radius-lg)] p-5 h-[330px]">
            <h3 className="text-[14px] font-semibold text-textPrimary">Revenue vs Expenses</h3>
            <p className="text-[12px] text-textMuted mt-1 mb-4">Monthly breakdown</p>
            <ResponsiveContainer width="100%" height="82%">
              <BarChart data={chartData}>
                <CartesianGrid stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={11} tickFormatter={(value) => money.format(Number(value))} />
                <Tooltip formatter={(value) => money.format(Number(value))} cursor={{ fill: '#F8FAFC' }} />
                <Bar dataKey="revenue" fill="#2563EB" radius={[5, 5, 0, 0]} />
                <Bar dataKey="expenses" fill="#BFDBFE" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card border border-border rounded-[var(--radius-lg)] p-0 overflow-hidden">
            <div className="p-5 border-b border-border flex justify-between items-center">
              <div>
                <h3 className="text-[14px] font-semibold text-textPrimary">Recent Transactions</h3>
                <p className="text-[12px] text-textMuted mt-1">Latest synchronized entries</p>
              </div>
            </div>
            {recentTransactions.length === 0 ? (
              <div className="text-center py-10 px-4 text-textMuted">
                <div className="mb-3 text-slate-300 flex justify-center"><Inbox size={34} /></div>
                <p className="text-[13px]">No transactions yet.</p>
                <p className="text-[12px] text-textMuted mt-1">Record a client payment or manual expense to see your dashboard come to life.</p>
                <button onClick={() => setModal('income')} className="mt-4 px-4 py-2 rounded-md bg-accent text-white text-[12px] font-medium hover:bg-accent-hover transition-colors">
                  Add Revenue
                </button>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-border">
                  <tr>
                    <th className="p-[10px_14px] text-[11px] font-semibold text-textMuted uppercase tracking-wider">Source/Desc</th>
                    <th className="p-[10px_14px] text-[11px] font-semibold text-textMuted uppercase tracking-wider">Date</th>
                    <th className="p-[10px_14px] text-[11px] font-semibold text-textMuted uppercase tracking-wider text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.map((tx) => (
                    <tr key={tx.id} onClick={() => router.push('/transactions')} className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer">
                      <td className="p-[12px_14px] text-[13px] text-textPrimary">{tx.notes || tx.sourceType}</td>
                      <td className="p-[12px_14px] text-[13px] text-textSecondary">{new Date(tx.date).toLocaleDateString()}</td>
                      <td className={`p-[12px_14px] text-[13px] font-mono font-medium text-right ${tx.type === 'INCOME' ? 'text-green-600' : 'text-red-500'}`}>
                        {tx.type === 'INCOME' ? '+' : '-'}{money.format(tx.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="space-y-[14px]">
          <div className="bg-card border border-border rounded-[var(--radius-lg)] p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[14px] font-semibold text-textPrimary">Clients Overview</h3>
              <span className="text-[11px] font-medium bg-blue-50 text-accent px-2 py-1 rounded-full">{overview.totalClients} Total</span>
            </div>
            <div className="flex flex-col gap-3">
              <Metric label="Active Clients" value={overview.activeClients.toString()} />
              <Metric label="Average Revenue" value={money.format(overview.totalClients ? overview.totalRevenue / overview.totalClients : 0)} />
            </div>
          </div>

          <Link href="/subscriptions" className="block bg-card border border-border rounded-[var(--radius-lg)] p-5 hover:shadow-[var(--shadow-md)] hover:border-blue-200 transition-all">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[14px] font-semibold text-textPrimary">Active Subscriptions</h3>
              <span className="text-[12px] text-accent">View all -&gt;</span>
            </div>
            <Metric label="Monthly Tools" value={money.format(overview.subscriptionBurden)} />
            <div className="h-2 bg-slate-100 rounded-full mt-4 overflow-hidden">
              <div
                className="h-full bg-accent rounded-full"
                style={{ width: `${Math.min(100, overview.totalRevenue ? (overview.subscriptionBurden / overview.totalRevenue) * 100 : 0)}%` }}
              />
            </div>
            <div className="mt-4 divide-y divide-slate-50 border-t border-slate-50">
              {subscriptions.slice(0, 4).map((sub) => (
                <div key={sub.id} className="py-2 flex items-center justify-between text-[12px]">
                  <span className="text-textSecondary">{sub.name}</span>
                  <span className="text-textMuted">{new Date(sub.nextBillingDate).toLocaleDateString()}</span>
                </div>
              ))}
              {subscriptions.length > 4 && <div className="pt-2 text-[12px] text-textMuted">... and {subscriptions.length - 4} more</div>}
            </div>
          </Link>
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 z-[200] bg-slate-900/40 flex items-center justify-center p-4" onMouseDown={() => { if (!isSaving) setModal(null); }}>
          <div className="bg-white rounded-[var(--radius-xl)] border border-border shadow-xl w-full max-w-[480px] p-6" onMouseDown={(event) => event.stopPropagation()}>
            {(modal === 'income' || modal === 'expense') && (
              <TransactionForm type={modal === 'income' ? 'INCOME' : 'EXPENSE'} error={modalError} isSaving={isSaving} onCancel={() => setModal(null)} onSave={saveTransaction} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, detail, icon, href, tone = 'muted' }: { label: string; value: string; detail: string; icon: React.ReactNode; href: string; tone?: 'green' | 'red' | 'muted' }) {
  const toneClass = tone === 'green' ? 'text-green-600' : tone === 'red' ? 'text-red-600' : 'text-textMuted';
  return (
    <Link href={href} className="block bg-card border border-border rounded-[var(--radius-lg)] p-[18px_20px] cursor-pointer hover:shadow-[var(--shadow-md)] hover:border-blue-200 transition-all">
      <div className="text-[12px] text-textMuted font-normal mb-[6px]">{label}</div>
      <div className="text-[24px] font-semibold tracking-tight text-textPrimary">{value}</div>
      <div className={`text-[12px] mt-[6px] flex items-center gap-1 ${toneClass}`}>
        {icon} {detail}
      </div>
    </Link>
  );
}

function ActionButton({ icon, label, onClick, href }: { icon: React.ReactNode; label: string; onClick?: () => void; href?: string }) {
  const content = (
    <>
      <div className="w-[36px] h-[36px] rounded-md bg-slate-100 flex items-center justify-center text-textSecondary group-hover:bg-blue-100 group-hover:text-accent transition-all">
        {icon}
      </div>
      <div className="text-[12px] font-medium text-textSecondary">{label}</div>
    </>
  );

  const className = "flex flex-col items-center gap-[8px] p-[16px_12px] bg-card border border-border rounded-[var(--radius-lg)] cursor-pointer hover:bg-accent-light hover:border-blue-200 transition-all group";

  if (href) {
    return <Link href={href} className={className}>{content}</Link>;
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center text-[13px]">
      <span className="text-textSecondary">{label}</span>
      <span className="font-semibold text-textPrimary">{value}</span>
    </div>
  );
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="text-center py-10 text-textMuted">
      <div className="mb-3 text-slate-300 flex justify-center">{icon}</div>
      <p className="text-[13px]">{text}</p>
    </div>
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

const inputClass = 'w-full px-3 py-2 border border-border rounded-md text-[13px] outline-none focus:border-accent bg-background';

function TransactionForm({ type, error, isSaving, onCancel, onSave }: { type: 'INCOME' | 'EXPENSE'; error: string | null; isSaving: boolean; onCancel: () => void; onSave: (formData: FormData, type: 'INCOME' | 'EXPENSE') => void }) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSave(new FormData(event.currentTarget), type);
      }}
      className="space-y-4"
    >
      <div>
        <h2 className="text-[16px] font-semibold text-textPrimary">{type === 'INCOME' ? 'Add Revenue' : 'Log Expense'}</h2>
        <p className="text-[13px] text-textMuted">Record a {type === 'INCOME' ? 'client payment or project win' : 'tool, tax, or operating cost'}.</p>
        {error && <p className="text-[13px] text-red-600 mt-2">{error}</p>}
      </div>
      <Field label="Description">
        <input name="notes" className={inputClass} placeholder={type === 'INCOME' ? 'Website design project' : 'Adobe Creative Cloud'} required />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Amount">
          <input name="amount" type="number" min="0" step="0.01" className={inputClass} required />
        </Field>
        <Field label="Date">
          <input name="date" type="date" defaultValue={today()} className={inputClass} required />
        </Field>
      </div>
      <Field label="Category">
        <select name="categoryId" className={inputClass}>
          {type === 'INCOME' ? (
            <>
              <option value="CLIENT">Client Payment</option>
              <option value="PROJECT">Project Revenue</option>
              <option value="OTHER">Other Income</option>
            </>
          ) : (
            <>
              <option value="TOOLS">Tools</option>
              <option value="OPERATIONS">Operations</option>
              <option value="TAXES">Taxes</option>
              <option value="OTHER">Other Expense</option>
            </>
          )}
        </select>
      </Field>
      <div className="flex justify-end gap-2 pt-2 border-t border-border">
        <button type="button" disabled={isSaving} onClick={onCancel} className="px-4 py-2 rounded-md border border-border text-[13px] text-textSecondary hover:bg-slate-100 disabled:opacity-60">Cancel</button>
        <button disabled={isSaving} className="px-4 py-2 rounded-md bg-accent text-white text-[13px] font-medium hover:bg-accent-hover disabled:opacity-60">{isSaving ? 'Saving...' : 'Save Entry'}</button>
      </div>
    </form>
  );
}
