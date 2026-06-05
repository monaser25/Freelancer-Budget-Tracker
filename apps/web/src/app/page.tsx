'use client';

import dynamic from 'next/dynamic';
import { useFinancialStore } from '@/store/useFinancialStore';
import { Client, Subscription, Transaction } from '@/types/finance';
import { computeNextBillingDate } from '@/store/financialStore';
import { makeCurrencyFormatter } from '@/lib/currency';
import { formatDate } from '@/lib/format';
import { useLocale } from '@/lib/i18n';
import type { Locale } from '@/lib/locales';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, SectionHeader, StatCard } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { Field, Input, Select } from '@/components/ui/Form';
import { InlineAlert } from '@/components/ui/InlineAlert';

type ModalType = 'income' | 'expense' | 'client' | 'subscription' | null;
type MonthlyChartRow = {
  key: string;
  month: string;
  revenue: number;
  expenses: number;
};

const DashboardMonthlyChart = dynamic(
  () => import('@/components/charts/DashboardMonthlyChart').then((mod) => mod.DashboardMonthlyChart),
  { ssr: false, loading: () => <div className="h-[260px] w-full mt-4" /> },
);

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

function getRelativeDate(isoDate: string, locale: Locale) {
  const txDate = new Date(isoDate);
  const diff = new Date().getTime() - txDate.getTime();
  if (diff < 0) return formatDate(txDate, locale, { month: 'short', day: 'numeric' });
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return formatDate(txDate, locale, { month: 'short', day: 'numeric' });
}

export default function DashboardPage() {
  const router = useRouter();
  const { locale } = useLocale();
  const {
    transactions,
    subscriptions,
    clients,
    overview,
    currency,
    error,
    addTransaction,
    addClient,
    addSubscription,
  } = useFinancialStore();
  const [modal, setModal] = useState<ModalType>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const money0 = useMemo(() => makeCurrencyFormatter(currency, { maximumFractionDigits: 0 }, locale), [currency, locale]);
  const money2 = useMemo(() => makeCurrencyFormatter(currency, { minimumFractionDigits: 2 }, locale), [currency, locale]);
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
        month: formatDate(date, locale, { month: 'short' }),
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
  }, [transactions, locale]);

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

  const saveClient = async (formData: FormData) => {
    const paymentType = String(formData.get('paymentType') || 'onetime') as Client['paymentType'];
    const revenue = Number(formData.get('revenue') || 0);
    const name = String(formData.get('name') || '').trim();
    const paymentDate = String(formData.get('paymentDate') || today());
    const nextBillingDate = paymentType === 'retainer'
      ? String(formData.get('nextBillingDate') || computeNextBillingDate(new Date().getDate()))
      : undefined;

    if (!name || revenue <= 0) {
      setModalError('Name and a positive amount are required.');
      return;
    }

    setIsSaving(true);
    setModalError(null);
    try {
      await addClient({
        id: makeId(),
        name,
        company: String(formData.get('company') || '').trim(),
        email: String(formData.get('email') || '').trim(),
        revenue,
        clientType: String(formData.get('clientType') || 'COMPANY') as Client['clientType'],
        status: 'ACTIVE',
        paymentType,
        paymentDate: paymentType === 'onetime' ? paymentDate : undefined,
        billingDay: nextBillingDate ? Math.max(1, Math.min(28, new Date(`${nextBillingDate}T12:00:00`).getDate())) : undefined,
        nextBillingDate,
        recorded: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      setModal(null);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Failed to create client');
    } finally {
      setIsSaving(false);
    }
  };

  const saveSubscription = async (formData: FormData) => {
    const name = String(formData.get('name') || '').trim();
    const amount = Number(formData.get('amount') || 0);
    const cycle = String(formData.get('billingCycle') || 'MONTHLY') as Subscription['cycle'];
    const nextBillingDate = String(formData.get('nextBillingDate') || computeNextBillingDate(new Date().getDate()));

    if (!name || amount <= 0 || !nextBillingDate) {
      setModalError('Name, amount, and next billing date are required.');
      return;
    }

    setIsSaving(true);
    setModalError(null);
    try {
      await addSubscription({
        id: makeId(),
        name,
        amount,
        cycle,
        billingCycle: cycle,
        notes: String(formData.get('notes') || '').trim(),
        billingDay: Math.max(1, Math.min(28, new Date(`${nextBillingDate}T12:00:00`).getDate())),
        nextBillingDate,
        status: 'ACTIVE',
      });
      setModal(null);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Failed to create subscription');
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
        <Button variant="secondary" icon="RefreshCw" onClick={() => { setModalError(null); setModal('subscription'); }}>Add subscription</Button>
        <Button variant="secondary" icon="Users" onClick={() => { setModalError(null); setModal('client'); }}>Add client</Button>
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
          <DashboardMonthlyChart data={chartData} formatAmount={money0.format} />
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
                      <div className="text-xs text-text-muted">Renews {formatDate(s.nextBillingDate, locale, { month: 'short', day: 'numeric' })}</div>
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
                          <div className="text-xs text-text-muted mt-0.5">{tx.categoryId} &middot; {getRelativeDate(tx.date, locale)}</div>
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
          <Card role="dialog" aria-modal="true" aria-labelledby="dashboard-modal-title" className="w-full max-w-md my-8 relative shadow-xl" pad={24} onMouseDown={(event) => event.stopPropagation()}>
            {(modal === 'income' || modal === 'expense') && (
              <DashboardTransactionForm
                type={modal === 'income' ? 'INCOME' : 'EXPENSE'}
                currencyPrefix={currencyPrefix}
                error={modalError}
                isSaving={isSaving}
                onCancel={() => setModal(null)}
                onSave={saveTransaction}
              />
            )}
            {modal === 'client' && (
              <DashboardClientForm
                currencyPrefix={currencyPrefix}
                error={modalError}
                isSaving={isSaving}
                onCancel={() => setModal(null)}
                onSave={saveClient}
              />
            )}
            {modal === 'subscription' && (
              <DashboardSubscriptionForm
                currencyPrefix={currencyPrefix}
                error={modalError}
                isSaving={isSaving}
                onCancel={() => setModal(null)}
                onSave={saveSubscription}
              />
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

function DashboardTransactionForm({ type, currencyPrefix, error, isSaving, onCancel, onSave }: { type: 'INCOME' | 'EXPENSE'; currencyPrefix: string; error: string | null; isSaving: boolean; onCancel: () => void; onSave: (formData: FormData, type: 'INCOME' | 'EXPENSE') => void }) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSave(new FormData(event.currentTarget), type);
      }}
      className="flex flex-col gap-4"
    >
      <div>
        <h2 id="dashboard-modal-title" className="t-h3">{type === 'INCOME' ? 'Add revenue' : 'Log expense'}</h2>
        <p className="text-sm text-text-muted mt-1">Record a {type === 'INCOME' ? 'client payment or project win' : 'tool, tax, or operating cost'}.</p>
        {error && <p className="text-sm text-negative mt-2">{error}</p>}
      </div>
      <Field label="Transaction name">
        <Input name="name" placeholder={type === 'INCOME' ? 'Website design project' : 'Adobe Creative Cloud'} required autoFocus />
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
        </Select>
      </Field>
      <div className="flex justify-end gap-2 pt-2 mt-2">
        <Button type="button" variant="ghost" disabled={isSaving} onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={isSaving}>{isSaving ? 'Saving...' : 'Save entry'}</Button>
      </div>
    </form>
  );
}

function DashboardClientForm({ currencyPrefix, error, isSaving, onCancel, onSave }: { currencyPrefix: string; error: string | null; isSaving: boolean; onCancel: () => void; onSave: (formData: FormData) => void }) {
  const [paymentType, setPaymentType] = useState<Client['paymentType']>('onetime');

  return (
    <form onSubmit={(event) => { event.preventDefault(); onSave(new FormData(event.currentTarget)); }} className="flex flex-col gap-4">
      <div>
        <h2 id="dashboard-modal-title" className="t-h3">Add client</h2>
        <p className="text-sm text-text-muted mt-1">Create a one-time client or monthly retainer from here.</p>
        {error && <p className="text-sm text-negative mt-2">{error}</p>}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Client name">
          <Input name="name" required autoFocus />
        </Field>
        <Field label="Amount">
          <Input name="revenue" type="number" min="0" step="0.01" required prefix={currencyPrefix} />
        </Field>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Company">
          <Input name="company" />
        </Field>
        <Field label="Email">
          <Input name="email" type="email" />
        </Field>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Client type">
          <Select name="clientType" defaultValue="COMPANY">
            <option value="COMPANY">Company</option>
            <option value="INDIVIDUAL">Individual</option>
          </Select>
        </Field>
        <Field label="Payment type">
          <Select name="paymentType" value={paymentType} onChange={(event) => setPaymentType(event.target.value as Client['paymentType'])}>
            <option value="onetime">One-time payment</option>
            <option value="retainer">Monthly retainer</option>
          </Select>
        </Field>
      </div>
      {paymentType === 'retainer' ? (
        <Field label="Next billing date">
          <Input name="nextBillingDate" type="date" defaultValue={computeNextBillingDate(new Date().getDate())} required />
        </Field>
      ) : (
        <Field label="Payment date">
          <Input name="paymentDate" type="date" defaultValue={today()} required />
        </Field>
      )}
      <div className="flex justify-end gap-2 pt-2 mt-2">
        <Button type="button" variant="ghost" disabled={isSaving} onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={isSaving}>{isSaving ? 'Saving...' : 'Save client'}</Button>
      </div>
    </form>
  );
}

function DashboardSubscriptionForm({ currencyPrefix, error, isSaving, onCancel, onSave }: { currencyPrefix: string; error: string | null; isSaving: boolean; onCancel: () => void; onSave: (formData: FormData) => void }) {
  return (
    <form onSubmit={(event) => { event.preventDefault(); onSave(new FormData(event.currentTarget)); }} className="flex flex-col gap-4">
      <div>
        <h2 id="dashboard-modal-title" className="t-h3">Add subscription</h2>
        <p className="text-sm text-text-muted mt-1">Track a recurring software or service cost.</p>
        {error && <p className="text-sm text-negative mt-2">{error}</p>}
      </div>
      <Field label="Service name">
        <Input name="name" placeholder="Vercel Pro" required autoFocus />
      </Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Cost">
          <Input name="amount" type="number" min="0" step="0.01" required prefix={currencyPrefix} />
        </Field>
        <Field label="Next billing date">
          <Input name="nextBillingDate" type="date" defaultValue={computeNextBillingDate(new Date().getDate())} required />
        </Field>
      </div>
      <Field label="Billing cycle">
        <Select name="billingCycle" defaultValue="MONTHLY">
          <option value="MONTHLY">Monthly</option>
          <option value="QUARTERLY">Quarterly</option>
          <option value="YEARLY">Yearly</option>
        </Select>
      </Field>
      <Field label="Notes">
        <Input name="notes" placeholder="Optional" />
      </Field>
      <div className="flex justify-end gap-2 pt-2 mt-2">
        <Button type="button" variant="ghost" disabled={isSaving} onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={isSaving}>{isSaving ? 'Saving...' : 'Save subscription'}</Button>
      </div>
    </form>
  );
}
