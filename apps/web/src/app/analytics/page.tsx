'use client';

import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useFinancialStore } from '@/store/useFinancialStore';
import { Transaction } from '@/types/finance';
import { makeCurrencyFormatter } from '@/lib/currency';

type Period = 'week' | 'month' | 'year';

const ACCENT = '#2563EB';

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
  const [period, setPeriod] = useState<Period>('month');
  const money = useMemo(() => makeCurrencyFormatter(currency, { maximumFractionDigits: 0 }), [currency]);

  const { start, end } = useMemo(() => getPeriodRange(period), [period]);

  const periodTxs = useMemo(
    () => transactions.filter(tx => inRange(tx, start, end)),
    [transactions, start, end],
  );

  const periodRevenue = useMemo(() => periodTxs.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0), [periodTxs]);
  const periodExpenses = useMemo(() => periodTxs.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0), [periodTxs]);
  const periodProfit = periodRevenue - periodExpenses;
  const periodMargin = periodRevenue > 0 ? Math.round((periodProfit / periodRevenue) * 100) : 0;

  const chartBuckets = useMemo(() => getChartBuckets(period, transactions), [period, transactions]);
  const chartEmpty = chartBuckets.every(b => b.revenue === 0 && b.expenses === 0);

  const categoryRows = useMemo(() => {
    const map: Record<string, number> = {};
    periodTxs.filter(t => t.type === 'EXPENSE').forEach(t => {
      map[t.categoryId] = (map[t.categoryId] || 0) + t.amount;
    });
    return Object.entries(map).map(([cat, amt]) => ({ category: cat, amount: amt })).sort((a, b) => b.amount - a.amount);
  }, [periodTxs]);

  const clientRows = useMemo(() => {
    return clients.map(client => {
      const rev = periodTxs
        .filter(t => t.type === 'INCOME' && (t.clientId === client.id || (t.sourceType === 'client' && t.sourceId === client.id)))
        .reduce((s, t) => s + t.amount, 0);
      return { client, revenue: rev };
    }).sort((a, b) => b.revenue - a.revenue);
  }, [clients, periodTxs]);

  const subCosts = useMemo(() => {
    return subscriptions.map(sub => {
      const cost = periodTxs
        .filter(t => t.subscriptionId === sub.id || (t.sourceType === 'subscription' && t.sourceId === sub.id))
        .reduce((s, t) => s + t.amount, 0);
      return { sub, cost };
    }).filter(s => s.cost > 0).sort((a, b) => b.cost - a.cost);
  }, [subscriptions, periodTxs]);

  const activeClients = clients.filter(c => c.status === 'ACTIVE').length;
  const retainerClients = clients.filter(c => c.paymentType === 'retainer').length;
  const activeSubscriptions = subscriptions.filter(s => s.status === 'ACTIVE').length;

  const periodLabel = period === 'week' ? 'This week' : period === 'month' ? 'This month' : 'This year';
  const allTimeMargin = overview.totalRevenue > 0 ? Math.round((overview.netProfit / overview.totalRevenue) * 100) : 0;

  return (
    <div className="space-y-6">

      {/* ── header + period tabs ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[14px] font-semibold text-textPrimary">Analytics</h1>
          <p className="text-[12px] text-textMuted mt-0.5">Detailed financial breakdown and trends</p>
        </div>
        <div className="flex bg-slate-100 rounded-lg p-1 gap-0.5">
          {(['week', 'month', 'year'] as Period[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 rounded-md text-[13px] font-medium transition-all ${
                period === p
                  ? 'bg-white text-textPrimary shadow-sm'
                  : 'text-textMuted hover:text-textSecondary'
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* ── period metrics ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-[14px]">
        <MetricCard label="Revenue" sub={periodLabel} value={money.format(periodRevenue)} valueClass="text-green-600" />
        <MetricCard label="Expenses" sub={periodLabel} value={money.format(periodExpenses)} valueClass="text-red-500" />
        <MetricCard label="Net Profit" sub={periodLabel} value={money.format(periodProfit)} valueClass={periodProfit >= 0 ? 'text-green-600' : 'text-red-500'} />
        <MetricCard label="Profit Margin" sub={periodLabel} value={`${periodMargin}%`} valueClass={periodMargin >= 0 ? 'text-accent' : 'text-red-500'} />
      </div>

      {/* ── revenue vs expenses chart ── */}
      <div className="bg-card border border-border rounded-[var(--radius-lg)] p-5">
        <h2 className="text-[14px] font-semibold text-textPrimary">Revenue vs Expenses</h2>
        <p className="text-[12px] text-textMuted mt-0.5 mb-5">
          {period === 'week' ? 'Daily breakdown this week' : period === 'month' ? 'Weekly breakdown this month' : 'Monthly breakdown this year'}
        </p>
        {chartEmpty ? (
          <div className="h-[220px] flex items-center justify-center text-[13px] text-textMuted">No transactions for this period</div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartBuckets} barGap={4} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="label" fontSize={11} tick={{ fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis fontSize={11} tick={{ fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={v => money.format(Number(v))} width={55} />
              <Tooltip
                formatter={(value, name) => [money.format(Number(value)), name === 'revenue' ? 'Revenue' : 'Expenses']}
                contentStyle={{ fontSize: 12, borderColor: '#E2E8F0', borderRadius: 8 }}
              />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} formatter={v => v === 'revenue' ? 'Revenue' : 'Expenses'} />
              <Bar dataKey="revenue" fill="#16A34A" radius={[4, 4, 0, 0]} name="revenue" />
              <Bar dataKey="expenses" fill="#EF4444" radius={[4, 4, 0, 0]} name="expenses" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── clients + expenses row ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* clients */}
        <div className="bg-card border border-border rounded-[var(--radius-lg)] overflow-hidden">
          <div className="p-5 border-b border-border">
            <h2 className="text-[14px] font-semibold text-textPrimary">Client Revenue</h2>
            <p className="text-[12px] text-textMuted mt-0.5">{periodLabel} · income per client</p>
          </div>

          <div className="grid grid-cols-3 divide-x divide-border border-b border-border">
            <StatMini label="Total Clients" value={String(clients.length)} />
            <StatMini label="Active" value={String(activeClients)} />
            <StatMini label="Retainers" value={String(retainerClients)} />
          </div>

          {clientRows.length === 0 ? (
            <div className="py-10 text-center text-[13px] text-textMuted">No clients yet</div>
          ) : clientRows.every(r => r.revenue === 0) ? (
            <div className="py-10 text-center text-[13px] text-textMuted">No client income recorded {periodLabel.toLowerCase()}</div>
          ) : (
            <div className="divide-y divide-slate-50">
              {clientRows.map(({ client, revenue }) => {
                const pct = periodRevenue > 0 ? Math.round((revenue / periodRevenue) * 100) : 0;
                return (
                  <div key={client.id} className="px-5 py-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center text-[12px] font-bold shrink-0">
                      {client.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[13px] font-medium text-textPrimary truncate">{client.name}</span>
                        <span className={`text-[13px] font-semibold shrink-0 ${revenue > 0 ? 'text-green-600' : 'text-textMuted'}`}>{money.format(revenue)}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[11px] text-textMuted shrink-0 w-10 text-right">{pct}%</span>
                        <span className="text-[11px] text-textMuted shrink-0">
                          {client.paymentType === 'retainer' ? 'Retainer' : 'One-time'} · {client.status}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* expenses by category */}
        <div className="bg-card border border-border rounded-[var(--radius-lg)] overflow-hidden">
          <div className="p-5 border-b border-border">
            <h2 className="text-[14px] font-semibold text-textPrimary">Expenses by Category</h2>
            <p className="text-[12px] text-textMuted mt-0.5">{periodLabel} · where costs concentrate</p>
          </div>

          {categoryRows.length === 0 ? (
            <div className="py-10 text-center text-[13px] text-textMuted">No expenses recorded {periodLabel.toLowerCase()}</div>
          ) : (
            <>
              <div className="px-5 pt-5 pb-2">
                <ResponsiveContainer width="100%" height={Math.max(120, categoryRows.length * 38)}>
                  <BarChart data={categoryRows} layout="vertical" margin={{ left: 0, right: 24, top: 0, bottom: 0 }}>
                    <CartesianGrid stroke="#F1F5F9" horizontal={false} />
                    <XAxis type="number" tickFormatter={v => money.format(Number(v))} fontSize={11} tick={{ fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="category" width={86} fontSize={11} tick={{ fill: '#64748B' }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={v => money.format(Number(v))} contentStyle={{ fontSize: 12, borderColor: '#E2E8F0', borderRadius: 8 }} />
                    <Bar dataKey="amount" fill={ACCENT} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="divide-y divide-slate-50 border-t border-border">
                {categoryRows.map(({ category, amount }) => {
                  const pct = periodExpenses > 0 ? Math.round((amount / periodExpenses) * 100) : 0;
                  return (
                    <div key={category} className="px-5 py-2.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-accent shrink-0" />
                        <span className="text-[13px] text-textPrimary">{category}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-accent rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[13px] font-medium text-textPrimary w-16 text-right tabular-nums">{money.format(amount)}</span>
                        <span className="text-[11px] text-textMuted w-7 text-right">{pct}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── subscription costs ── */}
      {(subCosts.length > 0 || activeSubscriptions > 0) && (
        <div className="bg-card border border-border rounded-[var(--radius-lg)] overflow-hidden">
          <div className="p-5 border-b border-border flex items-center justify-between gap-3">
            <div>
              <h2 className="text-[14px] font-semibold text-textPrimary">Subscription Costs</h2>
              <p className="text-[12px] text-textMuted mt-0.5">{activeSubscriptions} active subscription{activeSubscriptions !== 1 ? 's' : ''} · {periodLabel.toLowerCase()}</p>
            </div>
            <div className="text-right">
              <div className="text-[14px] font-semibold text-red-500">{money.format(subCosts.reduce((s, r) => s + r.cost, 0))}</div>
              <div className="text-[11px] text-textMuted">total this period</div>
            </div>
          </div>

          {subCosts.length === 0 ? (
            <div className="py-8 text-center text-[13px] text-textMuted">No subscription charges recorded {periodLabel.toLowerCase()}</div>
          ) : (
            <div className="divide-y divide-slate-50">
              {subCosts.map(({ sub, cost }) => {
                const pct = periodExpenses > 0 ? Math.round((cost / periodExpenses) * 100) : 0;
                return (
                  <div key={sub.id} className="px-5 py-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[13px] font-medium text-textPrimary">{sub.name}</span>
                        <span className="text-[13px] font-semibold text-red-500 shrink-0">{money.format(cost)}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-red-400 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[11px] text-textMuted shrink-0 w-10 text-right">{pct}% of expenses</span>
                        <span className="text-[11px] text-textMuted shrink-0">{sub.cycle.toLowerCase()} · {money.format(sub.amount)} billed</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── all-time summary ── */}
      <div className="bg-card border border-border rounded-[var(--radius-lg)] p-5">
        <h2 className="text-[14px] font-semibold text-textPrimary mb-5">All-Time Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          <SummaryBox label="Total Revenue" value={money.format(overview.totalRevenue)} sub="all recorded income" valueClass="text-green-600" />
          <SummaryBox label="Total Expenses" value={money.format(overview.totalExpenses)} sub="all recorded costs" valueClass="text-red-500" />
          <SummaryBox label="Net Profit" value={money.format(overview.netProfit)} sub={`${allTimeMargin}% margin`} valueClass={overview.netProfit >= 0 ? 'text-green-600' : 'text-red-500'} />
          <SummaryBox label="Monthly Tool Cost" value={`${money.format(overview.subscriptionBurden)}/mo`} sub={`${activeSubscriptions} active subscription${activeSubscriptions !== 1 ? 's' : ''}`} valueClass="text-textPrimary" />
        </div>

        <div className="mt-5 pt-5 border-t border-border grid grid-cols-2 md:grid-cols-4 gap-5">
          <SummaryBox label="Total Clients" value={String(overview.totalClients)} sub="across all statuses" valueClass="text-textPrimary" />
          <SummaryBox label="Active Clients" value={String(overview.activeClients)} sub={`${retainerClients} retainer${retainerClients !== 1 ? 's' : ''}`} valueClass="text-accent" />
          <SummaryBox label="Avg Revenue / Client" value={overview.totalClients > 0 ? money.format(overview.totalRevenue / overview.totalClients) : money.format(0)} sub="total ÷ clients" valueClass="text-textPrimary" />
          <SummaryBox label="Subscription Burden" value={`${money.format(overview.subscriptionBurden)}/mo`} sub="equivalent monthly cost" valueClass="text-textPrimary" />
        </div>
      </div>

    </div>
  );
}

// ─── sub-components ────────────────────────────────────────────────────────────

function MetricCard({ label, sub, value, valueClass }: { label: string; sub: string; value: string; valueClass: string }) {
  return (
    <div className="bg-card border border-border rounded-[var(--radius-lg)] p-5">
      <div className="text-[12px] text-textMuted">{label}</div>
      <div className={`text-[22px] font-semibold tracking-tight mt-1 ${valueClass}`}>{value}</div>
      <div className="text-[11px] text-textMuted mt-0.5">{sub}</div>
    </div>
  );
}

function StatMini({ label, value }: { label: string; value: string }) {
  return (
    <div className="py-4 text-center">
      <div className="text-[20px] font-semibold text-textPrimary">{value}</div>
      <div className="text-[11px] text-textMuted mt-0.5">{label}</div>
    </div>
  );
}

function SummaryBox({ label, value, sub, valueClass }: { label: string; value: string; sub: string; valueClass: string }) {
  return (
    <div>
      <div className="text-[12px] text-textMuted">{label}</div>
      <div className={`text-[18px] font-semibold mt-1 ${valueClass}`}>{value}</div>
      <div className="text-[11px] text-textMuted mt-0.5">{sub}</div>
    </div>
  );
}
