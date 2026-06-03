'use client';

import { useFinancialStore } from '@/store/useFinancialStore';
import { Transaction } from '@/types/finance';
import { makeCurrencyFormatter } from '@/lib/currency';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Button } from '@/components/ui/Button';
import { Card, SectionHeader, StatCard } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { Field, Input, Select } from '@/components/ui/Form';
import { InlineAlert } from '@/components/ui/InlineAlert';

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

function getRelativeDate(isoDate: string) {
  const txDate = new Date(isoDate);
  const diff = new Date().getTime() - txDate.getTime();
  if (diff < 0) return txDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return txDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function DashboardPage() {
  const router = useRouter();
  const {
    transactions,
    subscriptions,
    clients,
    overview,
    currency,
    error,
    addTransaction,
  } = useFinancialStore();
  const [modal, setModal] = useState<ModalType>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const money0 = useMemo(() => makeCurrencyFormatter(currency, { maximumFractionDigits: 0 }), [currency]);
  const money2 = useMemo(() => makeCurrencyFormatter(currency, { minimumFractionDigits: 2 }), [currency]);
  const currencyPrefix = useMemo(() => money2.formatToParts(0).find((part) => part.type === 'currency')?.value || currency, [currency, money2]);

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
  
  const activeSubscriptions = useMemo(
    () => subscriptions.filter((sub) => sub.status === 'ACTIVE' && !sub.archivedAt)
           .sort((a, b) => new Date(a.nextBillingDate).getTime() - new Date(b.nextBillingDate).getTime())
           .slice(0, 4),
    [subscriptions],
  );

  const topClient = useMemo(() => {
    const clientRev = clients.map(client => {
      const rev = transactions
        .filter(t => t.type === 'INCOME' && (t.clientId === client.id || (t.sourceType === 'client' && t.sourceId === client.id)))
        .reduce((s, t) => s + t.amount, 0);
      return { ...client, value: rev };
    }).sort((a, b) => b.value - a.value);
    return clientRev.length > 0 && clientRev[0].value > 0 ? clientRev[0] : null;
  }, [clients, transactions]);

  const saveTransaction = async (formData: FormData, type: 'INCOME' | 'EXPENSE') => {
    const amount = Number(formData.get('amount'));
    const name = String(formData.get('name') || '').trim();
    const notes = String(formData.get('notes') || '').trim();
    const date = String(formData.get('date') || today());
    const categoryId = String(formData.get('categoryId') || (type === 'INCOME' ? 'CLIENT' : 'TOOLS'));

    if (!name || !amount || amount <= 0) return;

    const tx: Transaction = {
      id: makeId(),
      name,
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

  const chartRevenue = chartData.reduce((sum, item) => sum + item.revenue, 0);
  const chartExpenses = chartData.reduce((sum, item) => sum + item.expenses, 0);
  const chartMargin = chartRevenue > 0 ? Math.round(((chartRevenue - chartExpenses) / chartRevenue) * 100) : 0;
  const chartMarginLabel = `${chartMargin > 0 ? '+' : ''}${chartMargin}% margin`;

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-10">
      {error && (
        <InlineAlert tone="warning" title="Sync Issue">
          {error}
        </InlineAlert>
      )}

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2.5">
        <Button icon="TrendingUp" onClick={() => { setModalError(null); setModal('income'); }}>Add revenue</Button>
        <Button variant="secondary" icon="Receipt" onClick={() => { setModalError(null); setModal('expense'); }}>Log expense</Button>
        <Button variant="secondary" icon="RefreshCw" onClick={() => router.push('/subscriptions?action=tool')}>Add subscription</Button>
        <Button variant="secondary" icon="Users" onClick={() => router.push('/clients?action=client')}>Add client</Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard 
          label="Total clients" 
          value={overview.totalClients} 
          icon="Users" 
          onClick={() => router.push('/clients')} 
        />
        <StatCard 
          label="Total revenue" 
          value={money0.format(overview.totalRevenue)} 
          tone="positive" 
          icon="TrendingUp" 
          onClick={() => router.push('/transactions?filter=revenue')} 
        />
        <StatCard 
          label="Total expenses" 
          value={money0.format(overview.totalExpenses)} 
          tone="negative" 
          icon="Receipt" 
          onClick={() => router.push('/transactions?filter=expenses')} 
        />
        <StatCard 
          label="Net profit" 
          value={money0.format(overview.netProfit)} 
          icon="Wallet" 
          onClick={() => router.push('/analytics')} 
        />
        <StatCard 
          label="Active subscriptions" 
          value={overview.activeSubscriptionsCount} 
          sub={`${money0.format(overview.subscriptionBurden)}/mo`} 
          icon="RefreshCw" 
          onClick={() => router.push('/subscriptions')} 
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        <Card className="lg:col-span-2 h-full" pad={22}>
          <SectionHeader 
            title="Revenue vs Expenses" 
            sub="Last 6 months" 
            action={<Badge tone={chartMargin >= 0 ? 'positive' : 'negative'} icon={chartMargin >= 0 ? 'TrendingUp' : 'TrendingDown'}>{chartMarginLabel}</Badge>} 
          />
          <div className="h-[260px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} dy={10} />
                <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => money0.format(Number(v))} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                <Tooltip 
                  formatter={(value: number) => money0.format(value)}
                  cursor={{ fill: 'var(--surface-hover)' }}
                  contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
                />
                <Bar dataKey="revenue" fill="var(--positive)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" fill="var(--negative)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <div className="flex flex-col gap-4">
          <Card pad={20}>
            <SectionHeader 
              title="Active subscriptions" 
              action={
                <button onClick={() => router.push('/subscriptions')} className="text-sm font-medium text-accent hover:underline">
                  View all
                </button>
              } 
            />
            {activeSubscriptions.length > 0 ? (
              <div className="flex flex-col gap-1 mt-2">
                {activeSubscriptions.map((s) => (
                  <div key={s.id} className="flex items-center gap-3 py-2">
                    <Avatar name={s.name} size={32} />
                    <div className="flex-1 min-w-0">
                      <div className="t-body-m truncate">{s.name}</div>
                      <div className="text-xs text-text-muted">Renews {new Date(s.nextBillingDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                    </div>
                    <span className="t-body-m font-mono">{money0.format(s.amount)}<span className="text-text-muted font-sans text-xs">/{s.cycle === 'YEARLY' ? 'yr' : 'mo'}</span></span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-text-muted py-4 text-center">No active subscriptions</div>
            )}
          </Card>

          {topClient && (
            <Card pad={20}>
              <div className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3">Top client</div>
              <div className="flex items-center gap-3">
                <Avatar name={topClient.name} size={40} />
                <div className="flex-1 min-w-0">
                  <div className="t-h3 truncate">{topClient.name}</div>
                  <div className="text-sm text-text-muted truncate">{topClient.email || topClient.company || 'Client'}</div>
                </div>
              </div>
              <div className="mt-4 pt-3.5 border-t border-border flex justify-between items-baseline">
                <span className="text-sm text-text-muted">Total paid</span>
                <span className="t-h3 font-mono text-positive">{money0.format(topClient.value)}</span>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <Card pad={0}>
        <div className="px-5 py-4 flex items-center justify-between border-b border-border">
          <span className="t-h3">Recent transactions</span>
          <button 
            onClick={() => router.push('/transactions')} 
            className="text-sm font-medium text-accent hover:underline inline-flex items-center gap-1"
          >
            View ledger <Icon name="ChevronRight" size={14} />
          </button>
        </div>
        
        {recentTransactions.length === 0 ? (
          <div className="text-center py-10 px-4 text-text-muted">
            <div className="mb-3 text-border-strong flex justify-center"><Icon name="Inbox" size={34} /></div>
            <p className="text-sm">No transactions yet.</p>
            <button onClick={() => setModal('income')} className="mt-4 text-sm font-medium text-accent hover:underline">
              Add revenue to get started
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <tbody>
                {recentTransactions.map((tx) => (
                  <tr 
                    key={tx.id} 
                    onClick={() => router.push('/transactions')} 
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        router.push('/transactions');
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    className="border-b last:border-b-0 border-border hover:bg-surface-hover focus:bg-surface-hover focus:outline-none cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center ${tx.type === 'INCOME' ? 'bg-positive-tint text-positive' : 'bg-negative-tint text-negative'}`}>
                          <Icon name={tx.type === 'INCOME' ? 'ArrowDown' : 'ArrowUp'} size={15} strokeWidth={2.2} />
                        </div>
                        <div>
                          <div className="t-body-m">{tx.name || tx.notes || tx.sourceType}</div>
                          <div className="text-xs text-text-muted mt-0.5">{tx.categoryId} &middot; {getRelativeDate(tx.date)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className={`t-body-m font-mono ${tx.type === 'INCOME' ? 'text-positive' : 'text-negative'}`}>
                        {tx.type === 'INCOME' ? '+' : '−'}{money2.format(tx.amount)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {modal && (
        <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-start sm:items-center justify-center p-4 overflow-y-auto" onMouseDown={() => { if (!isSaving) setModal(null); }}>
          <Card role="dialog" aria-modal="true" aria-labelledby="dashboard-transaction-title" className="w-full max-w-md my-8 relative shadow-xl" pad={24} onMouseDown={(event) => event.stopPropagation()}>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                saveTransaction(new FormData(event.currentTarget), modal === 'income' ? 'INCOME' : 'EXPENSE');
              }}
              className="flex flex-col gap-4"
            >
              <div>
                <h2 id="dashboard-transaction-title" className="t-h3">{modal === 'income' ? 'Add revenue' : 'Log expense'}</h2>
                <p className="text-sm text-text-muted mt-1">Record a {modal === 'income' ? 'client payment or project win' : 'tool, tax, or operating cost'}.</p>
                {modalError && <p className="text-sm text-negative mt-2">{modalError}</p>}
              </div>
              
              <Field label="Transaction Name">
                <Input name="name" placeholder={modal === 'income' ? 'Website design project' : 'Adobe Creative Cloud'} required autoFocus />
              </Field>
              
              <Field label="Notes">
                <Input name="notes" placeholder="Optional details" />
              </Field>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Amount">
                  <Input name="amount" type="number" min="0" step="0.01" required prefix={currencyPrefix} />
                </Field>
                <Field label="Date">
                  <Input name="date" type="date" defaultValue={today()} required />
                </Field>
              </div>
              
              <Field label="Category">
                <Select name="categoryId">
                  {modal === 'income' ? (
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
                </Select>
              </Field>
              
              <div className="flex justify-end gap-2 pt-2 mt-2">
                <Button type="button" variant="ghost" disabled={isSaving} onClick={() => setModal(null)}>Cancel</Button>
                <Button type="submit" loading={isSaving}>{isSaving ? 'Saving...' : 'Save Entry'}</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
