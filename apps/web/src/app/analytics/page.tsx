'use client';

import dynamic from 'next/dynamic';
import { useMemo, useState } from 'react';
import { useFinancialStore } from '@/store/useFinancialStore';
import { Subscription, Transaction } from '@/types/finance';
import { makeCurrencyFormatter } from '@/lib/currency';
import { useLocale } from '@/lib/i18n';
import { Card, SectionHeader, StatCard } from '@/components/ui/Card';
import { Segmented } from '@/components/ui/Form';
import { Avatar } from '@/components/ui/Avatar';

type Period = 'week' | 'month' | 'year';

const AnalyticsRevenueExpensesChart = dynamic(
  () => import('@/components/charts/AnalyticsCharts').then((mod) => mod.AnalyticsRevenueExpensesChart),
  { ssr: false, loading: () => <div className="h-[280px] w-full mt-4" /> },
);

const AnalyticsCategoryBarChart = dynamic(
  () => import('@/components/charts/AnalyticsCharts').then((mod) => mod.AnalyticsCategoryBarChart),
  { ssr: false, loading: () => <div className="mt-4 h-[160px]" /> },
);

const formatEnumLabel = (value: string) => value
  .toLowerCase()
  .split(/[_\s-]+/)
  .filter(Boolean)
  .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
  .join(' ');

// ─── period helpers ────────────────────────────────────────────────────────────

function getPeriodRange(period: Period): { start: Date; end: Date } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();

  if (period === 'week') {
    const dow = now.getDay(); // 0 = Sun
    const start = new Date(y, m, d - dow, 0, 0, 0);
    const end = new Date(y, m, d + (6 - dow), 23, 59, 59);
    return { start, end };
  }
  if (period === 'month') {
    return {
      start: new Date(y, m, 1, 0, 0, 0),
      end: new Date(y, m + 1, 0, 23, 59, 59),
    };
  }
  return {
    start: new Date(y, 0, 1, 0, 0, 0),
    end: new Date(y, 11, 31, 23, 59, 59),
  };
}

function inRange(tx: Transaction, start: Date, end: Date) {
  const d = new Date(tx.date);
  return d >= start && d <= end;
}

function getMonthlySubscriptionAmount(subscription: Subscription) {
  const cycle = subscription.billingCycle || subscription.cycle;
  if (cycle === 'YEARLY') return subscription.amount / 12;
  if (cycle === 'QUARTERLY') return subscription.amount / 3;
  return subscription.amount;
}

function getChartBuckets(period: Period, transactions: Transaction[]) {
  const { start } = getPeriodRange(period);
  const y = start.getFullYear();
  const mo = start.getMonth();

  if (period === 'week') {
    const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return DAYS.map((label, i) => {
      const day = new Date(y, mo, start.getDate() + i);
      const ds = day.toISOString().slice(0, 10);
      const rev = transactions.filter(t => t.type === 'INCOME' && t.date.slice(0, 10) === ds).reduce((s, t) => s + t.amount, 0);
      const exp = transactions.filter(t => t.type === 'EXPENSE' && t.date.slice(0, 10) === ds).reduce((s, t) => s + t.amount, 0);
      return { label, revenue: rev, expenses: exp };
    });
  }

  if (period === 'month') {
    const daysInMonth = new Date(y, mo + 1, 0).getDate();
    const buckets: { label: string; startDay: number; endDay: number }[] = [];
    for (let w = 1; w <= daysInMonth; w += 7) {
      buckets.push({ label: `Wk ${Math.ceil(w / 7)}`, startDay: w, endDay: Math.min(w + 6, daysInMonth) });
    }
    return buckets.map(({ label, startDay, endDay }) => {
      const rev = transactions.filter(t => {
        const d = new Date(t.date);
        return t.type === 'INCOME' && d.getFullYear() === y && d.getMonth() === mo && d.getDate() >= startDay && d.getDate() <= endDay;
      }).reduce((s, t) => s + t.amount, 0);
      const exp = transactions.filter(t => {
        const d = new Date(t.date);
        return t.type === 'EXPENSE' && d.getFullYear() === y && d.getMonth() === mo && d.getDate() >= startDay && d.getDate() <= endDay;
      }).reduce((s, t) => s + t.amount, 0);
      return { label, revenue: rev, expenses: exp };
    });
  }

  // year → monthly
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return MONTHS.map((label, i) => {
    const rev = transactions.filter(t => { const d = new Date(t.date); return t.type === 'INCOME' && d.getFullYear() === y && d.getMonth() === i; }).reduce((s, t) => s + t.amount, 0);
    const exp = transactions.filter(t => { const d = new Date(t.date); return t.type === 'EXPENSE' && d.getFullYear() === y && d.getMonth() === i; }).reduce((s, t) => s + t.amount, 0);
    return { label, revenue: rev, expenses: exp };
  });
}

// ─── page ──────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const { transactions, clients, subscriptions, overview, currency } = useFinancialStore();
  const { locale } = useLocale();
  const [period, setPeriod] = useState<Period>('month');
  const money = useMemo(() => makeCurrencyFormatter(currency, { maximumFractionDigits: 0 }, locale), [currency, locale]);

  const { start, end } = useMemo(() => getPeriodRange(period), [period]);
  const completedTransactions = useMemo(() => transactions.filter(tx => tx.status === 'COMPLETED'), [transactions]);

  const periodTxs = useMemo(
    () => completedTransactions.filter(tx => inRange(tx, start, end)),
    [completedTransactions, start, end],
  );

  const periodRevenue = useMemo(() => periodTxs.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0), [periodTxs]);
  const periodExpenses = useMemo(() => periodTxs.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0), [periodTxs]);
  const periodProfit = periodRevenue - periodExpenses;
  const periodMargin = periodRevenue > 0 ? Math.round((periodProfit / periodRevenue) * 100) : 0;

  const chartBuckets = useMemo(() => getChartBuckets(period, completedTransactions), [period, completedTransactions]);
  const chartEmpty = chartBuckets.every(b => b.revenue === 0 && b.expenses === 0);

  const categoryRows = useMemo(() => {
    const map: Record<string, number> = {};
    periodTxs.filter(t => t.type === 'EXPENSE').forEach(t => {
      map[t.categoryId] = (map[t.categoryId] || 0) + t.amount;
    });
    return Object.entries(map).map(([cat, amt]) => ({ category: formatEnumLabel(cat), amount: amt })).sort((a, b) => b.amount - a.amount);
  }, [periodTxs]);

  const clientRows = useMemo(() => {
    return clients.map(client => {
      const rev = periodTxs
        .filter(t => t.type === 'INCOME' && (t.clientId === client.id || (t.sourceType === 'client' && t.sourceId === client.id)))
        .reduce((s, t) => s + t.amount, 0);
      return { client, revenue: rev };
    }).sort((a, b) => b.revenue - a.revenue);
  }, [clients, periodTxs]);
  const revenueClientRows = useMemo(() => clientRows.filter((row) => row.revenue > 0), [clientRows]);
  
  const totalClientRev = useMemo(() => clientRows.reduce((a, c) => a + c.revenue, 0), [clientRows]);

  const subCosts = useMemo(() => {
    return subscriptions.map(sub => {
      const cost = periodTxs
        .filter(t => t.subscriptionId === sub.id || (t.sourceType === 'subscription' && t.sourceId === sub.id))
        .reduce((s, t) => s + t.amount, 0);
      return { sub, cost };
    }).filter(s => s.cost > 0).sort((a, b) => b.cost - a.cost);
  }, [subscriptions, periodTxs]);
  
  const activeSubs = subscriptions.filter(s => s.status === 'ACTIVE' && !s.archivedAt);
  const subscriptionPeriodTotal = subCosts.reduce((sum, row) => sum + row.cost, 0);

  const activeSubscriptions = activeSubs.length;

  const periodLabel = period === 'week' ? 'This week' : period === 'month' ? 'This month' : 'This year';
  const allTimeMargin = overview.totalRevenue > 0 ? Math.round((overview.netProfit / overview.totalRevenue) * 100) : 0;

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-10">

      {/* ── header + period tabs ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="t-h1">Analytics</h1>
          <p className="t-body mt-1 text-text-muted">Detailed financial breakdown and trends</p>
        </div>
        <div className="flex justify-end">
          <Segmented 
            options={[
              { label: 'Week', value: 'week' },
              { label: 'Month', value: 'month' },
              { label: 'Year', value: 'year' },
            ]}
            value={period}
            onChange={(v) => setPeriod(v as Period)}
          />
        </div>
      </div>

      {/* ── period metrics ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Revenue" value={money.format(periodRevenue)} tone="positive" sub={periodLabel} />
        <StatCard label="Expenses" value={money.format(periodExpenses)} tone="negative" sub={periodLabel} />
        <StatCard label="Net profit" value={money.format(periodProfit)} tone={periodProfit >= 0 ? 'positive' : 'negative'} sub={periodLabel} />
        <StatCard label="Profit margin" value={`${periodMargin}%`} tone={periodMargin >= 0 ? 'positive' : 'negative'} sub={periodLabel} />
      </div>

      {/* ── revenue vs expenses chart ── */}
      <Card pad={22}>
        <SectionHeader title="Revenue vs Expenses" sub={period === 'week' ? 'Daily breakdown this week' : period === 'month' ? 'Weekly breakdown this month' : 'Monthly breakdown this year'} />
        {chartEmpty ? (
          <div className="h-[220px] flex items-center justify-center text-sm text-text-muted">No transactions for this period</div>
        ) : (
          <AnalyticsRevenueExpensesChart data={chartBuckets} formatAmount={money.format} />
        )}
      </Card>

      {/* ── clients + expenses row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        {/* clients */}
        <Card pad={22}>
          <SectionHeader title="Revenue by client" sub={`${clients.length} clients · ${money.format(totalClientRev)} total`} />

          {clientRows.length === 0 ? (
            <div className="py-10 text-center text-sm text-text-muted">No clients yet</div>
          ) : clientRows.every(r => r.revenue === 0) ? (
            <div className="py-10 text-center text-sm text-text-muted">No client income recorded {periodLabel.toLowerCase()}</div>
          ) : (
            <div className="flex flex-col gap-3 mt-4">
              {revenueClientRows.map(({ client, revenue }, i) => {
                const pct = totalClientRev > 0 ? Math.round((revenue / totalClientRev) * 100) : 0;
                return (
                  <div key={client.id} className="flex items-center gap-3">
                    <span className="t-body-m font-mono text-text-muted w-[18px]">{i + 1}</span>
                    <Avatar name={client.name} size={30} />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between mb-1.5">
                        <span className="t-body-m truncate">{client.name}</span>
                        <span className="t-body-m font-mono">{money.format(revenue)}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-surface-hover overflow-hidden">
                        <div className="h-full bg-accent rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <span className="text-xs font-mono text-text-muted w-9 text-right">{pct}%</span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* expenses by category */}
        <Card pad={22}>
          <SectionHeader title="Expenses by category" sub={`${categoryRows.length} categories`} />

          {categoryRows.length === 0 ? (
            <div className="py-10 text-center text-sm text-text-muted">No expenses recorded {periodLabel.toLowerCase()}</div>
          ) : (
            <AnalyticsCategoryBarChart data={categoryRows} formatAmount={money.format} />
          )}
        </Card>
      </div>

      {/* ── subscription costs ── */}
      {(subCosts.length > 0 || activeSubscriptions > 0) && (
        <Card pad={22}>
          <SectionHeader 
            title="Subscription costs" 
            sub={`${activeSubscriptions} active subscription${activeSubscriptions !== 1 ? 's' : ''} · ${periodLabel.toLowerCase()}`}
            action={
              <div className="text-right">
                <div className="t-body-m font-mono text-negative">{money.format(subscriptionPeriodTotal)}</div>
                <div className="text-xs text-text-muted">total this period</div>
              </div>
            }
          />
          {subCosts.length === 0 ? (
            <div className="py-8 text-center text-sm text-text-muted">No subscription charges recorded {periodLabel.toLowerCase()}</div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3 mt-4">
              {subCosts.map(({ sub, cost }) => {
                const pct = periodExpenses > 0 ? Math.round((cost / periodExpenses) * 100) : 0;
                return (
                  <div key={sub.id} className="flex items-center gap-2.5 p-3 rounded-md border border-border">
                    <Avatar name={sub.name} size={32} />
                    <div className="flex-1 min-w-0">
                      <div className="t-body-m truncate">{sub.name}</div>
                      <div className="text-xs text-text-muted">{pct}% of expenses · {formatEnumLabel(sub.billingCycle || sub.cycle)} billing</div>
                    </div>
                    <span className="t-body-m font-mono text-negative">{money.format(cost)}</span>
                  </div>
                );
              })}
            </div>
          )}
          {activeSubscriptions > 0 && (
            <div className="mt-4 pt-4 border-t border-border text-sm text-text-muted">
              Equivalent monthly tool cost: <span className="font-mono text-text">{money.format(activeSubs.reduce((sum, sub) => sum + getMonthlySubscriptionAmount(sub), 0))}/mo</span>
            </div>
          )}
        </Card>
      )}

      {/* ── all-time summary ── */}
      <Card pad={22}>
        <SectionHeader title="All-time summary" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-[1px] bg-border rounded-md overflow-hidden mt-4">
          <SummaryBox label="Total revenue" value={money.format(overview.totalRevenue)} valueClass="text-positive" />
          <SummaryBox label="Total expenses" value={money.format(overview.totalExpenses)} valueClass="text-negative" />
          <SummaryBox label="Net profit" value={money.format(overview.netProfit)} valueClass={overview.netProfit >= 0 ? 'text-positive' : 'text-negative'} />
          <SummaryBox label="Profit margin" value={`${allTimeMargin}%`} valueClass={allTimeMargin >= 0 ? 'text-positive' : 'text-negative'} />
          <SummaryBox label="Active clients" value={overview.activeClients.toString()} />
          <SummaryBox label="Avg / client" value={money.format(overview.totalClients > 0 ? overview.totalRevenue / overview.totalClients : 0)} />
          <SummaryBox label="Active tools" value={activeSubscriptions.toString()} />
          <SummaryBox label="Tools / mo" value={money.format(overview.subscriptionBurden)} valueClass="text-negative" />
        </div>
      </Card>

    </div>
  );
}

// ─── sub-components ────────────────────────────────────────────────────────────

function SummaryBox({ label, value, valueClass = "text-text" }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="bg-surface p-4 sm:p-[16px_18px]">
      <div className="text-xs text-text-muted">{label}</div>
      <div className={`t-h2 font-mono mt-1.5 ${valueClass}`}>{value}</div>
    </div>
  );
}
