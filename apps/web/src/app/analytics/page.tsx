'use client';

import dynamic from 'next/dynamic';
import { useMemo, useState } from 'react';
import { useFinancialStore } from '@/store/useFinancialStore';
import { Subscription, Transaction } from '@/types/finance';
import { makeCompactCurrencyFormatter, makeLongCurrencyFormatter } from '@/lib/currency';
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

function getChartBuckets(period: Period, transactions: Transaction[], t: any) {
  const { start } = getPeriodRange(period);
  const y = start.getFullYear();
  const mo = start.getMonth();

  if (period === 'week') {
    const DAYS = [
      t('charts.days.0'), t('charts.days.1'), t('charts.days.2'), t('charts.days.3'),
      t('charts.days.4'), t('charts.days.5'), t('charts.days.6')
    ];
    return DAYS.map((label: string, i: number) => {
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
      buckets.push({ label: t('analytics.chart.weekLabel', { number: Math.ceil(w / 7) }), startDay: w, endDay: Math.min(w + 6, daysInMonth) });
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
  const MONTHS = [
    t('charts.months.0'), t('charts.months.1'), t('charts.months.2'), t('charts.months.3'),
    t('charts.months.4'), t('charts.months.5'), t('charts.months.6'), t('charts.months.7'),
    t('charts.months.8'), t('charts.months.9'), t('charts.months.10'), t('charts.months.11')
  ];
  return MONTHS.map((label: string, i: number) => {
    const rev = transactions.filter(t => { const d = new Date(t.date); return t.type === 'INCOME' && d.getFullYear() === y && d.getMonth() === i; }).reduce((s, t) => s + t.amount, 0);
    const exp = transactions.filter(t => { const d = new Date(t.date); return t.type === 'EXPENSE' && d.getFullYear() === y && d.getMonth() === i; }).reduce((s, t) => s + t.amount, 0);
    return { label, revenue: rev, expenses: exp };
  });
}

// ─── page ──────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const { transactions, clients, subscriptions, overview, currency } = useFinancialStore();
  const { t, locale, dir } = useLocale();
  const [period, setPeriod] = useState<Period>('month');
  const money = useMemo(() => makeCompactCurrencyFormatter(currency, { maximumFractionDigits: 0 }, locale), [currency, locale]);
  const moneyLong = useMemo(() => makeLongCurrencyFormatter(currency, { maximumFractionDigits: 0 }, locale), [currency, locale]);

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

  const chartBuckets = useMemo(() => getChartBuckets(period, completedTransactions, t), [period, completedTransactions, t]);
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

  const periodLabel = period === 'week' ? t('analytics.periodLabel.week') : period === 'month' ? t('analytics.periodLabel.month') : t('analytics.periodLabel.year');
  const allTimeMargin = overview.totalRevenue > 0 ? Math.round((overview.netProfit / overview.totalRevenue) * 100) : 0;

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-10">

      {/* ── header + period tabs ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="t-h1">{t('nav.analytics')}</h1>
          <p className="t-body mt-1 text-text-muted">{t('topbar.copy.analytics.subtitle')}</p>
        </div>
        <div className="flex justify-end" dir={dir}>
          <Segmented 
            options={[
              { label: t('analytics.period.week'), value: 'week' },
              { label: t('analytics.period.month'), value: 'month' },
              { label: t('analytics.period.year'), value: 'year' },
            ]}
            value={period}
            onChange={(v) => setPeriod(v as Period)}
          />
        </div>
      </div>

      {/* ── period metrics ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={t('analytics.stats.revenue')} value={<span dir="ltr">{money.format(periodRevenue)}</span>} tone="positive" sub={periodLabel} />
        <StatCard label={t('analytics.stats.expenses')} value={<span dir="ltr">{money.format(periodExpenses)}</span>} tone="negative" sub={periodLabel} />
        <StatCard label={t('analytics.stats.netProfit')} value={<span dir="ltr">{money.format(periodProfit)}</span>} tone={periodProfit >= 0 ? 'positive' : 'negative'} sub={periodLabel} />
        <StatCard label={t('analytics.stats.profitMargin')} value={<span dir="ltr">{`${periodMargin}%`}</span>} tone={periodMargin >= 0 ? 'positive' : 'negative'} sub={periodLabel} />
      </div>

      {/* ── revenue vs expenses chart ── */}
      <Card pad={22}>
        <SectionHeader title={t('analytics.chart.revenueVsExpenses')} sub={period === 'week' ? t('analytics.chart.dailyBreakdown') : period === 'month' ? t('analytics.chart.weeklyBreakdown') : t('analytics.chart.monthlyBreakdown')} />
        {chartEmpty ? (
          <div className="h-[220px] flex items-center justify-center text-sm text-text-muted">{t('analytics.empty.transactions')}</div>
        ) : (
          <AnalyticsRevenueExpensesChart data={chartBuckets} formatAmount={money.format} />
        )}
      </Card>

      {/* ── clients + expenses row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        {/* clients */}
        <Card pad={22}>
          <SectionHeader title={t('analytics.clients.title')} sub={t('analytics.clients.subtitle', { clients: clients.length, amount: money.format(totalClientRev) })} />

          {clientRows.length === 0 ? (
            <div className="py-10 text-center text-sm text-text-muted">{t('analytics.clients.empty')}</div>
          ) : clientRows.every(r => r.revenue === 0) ? (
            <div className="py-10 text-center text-sm text-text-muted">{t('analytics.clients.noIncome', { period: periodLabel.toLowerCase() })}</div>
          ) : (
            <div className="flex flex-col gap-3 mt-4">
              {revenueClientRows.map(({ client, revenue }, i) => {
                const pct = totalClientRev > 0 ? Math.round((revenue / totalClientRev) * 100) : 0;
                return (
                  <div key={client.id} className="flex items-center gap-3" dir={dir}>
                    <span className="t-body-m font-mono text-text-muted w-[18px]">{i + 1}</span>
                    <Avatar name={client.name} size={30} />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between mb-1.5">
                        <span className="t-body-m truncate">{client.name}</span>
                        <span className="t-body-m font-mono" dir="ltr">{money.format(revenue)}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-surface-hover overflow-hidden" dir="ltr">
                        <div className="h-full bg-accent rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <span className="text-xs font-mono text-text-muted w-9 text-right" dir="ltr">{pct}%</span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* expenses by category */}
        <Card pad={22}>
          <SectionHeader title={t('analytics.categories.title')} sub={t('analytics.categories.subtitle', { count: categoryRows.length })} />

          {categoryRows.length === 0 ? (
            <div className="py-10 text-center text-sm text-text-muted">{t('analytics.categories.empty', { period: periodLabel.toLowerCase() })}</div>
          ) : (
            <AnalyticsCategoryBarChart data={categoryRows} formatAmount={money.format} />
          )}
        </Card>
      </div>

      {/* ── subscription costs ── */}
      {(subCosts.length > 0 || activeSubscriptions > 0) && (
        <Card pad={22}>
          <SectionHeader 
            title={t('analytics.subscriptions.title')} 
            sub={activeSubscriptions === 1 ? t('analytics.subscriptions.subtitle', { count: activeSubscriptions, period: periodLabel.toLowerCase() }) : t('analytics.subscriptions.subtitlePlural', { count: activeSubscriptions, period: periodLabel.toLowerCase() })}
            action={
              <div className={dir === 'rtl' ? 'text-left' : 'text-right'}>
                <div className="t-body-m font-mono text-negative" dir="ltr">{money.format(subscriptionPeriodTotal)}</div>
                <div className="text-xs text-text-muted">{t('analytics.subscriptions.total')}</div>
              </div>
            }
          />
          {subCosts.length === 0 ? (
            <div className="py-8 text-center text-sm text-text-muted">{t('analytics.subscriptions.empty', { period: periodLabel.toLowerCase() })}</div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3 mt-4">
              {subCosts.map(({ sub, cost }) => {
                const pct = periodExpenses > 0 ? Math.round((cost / periodExpenses) * 100) : 0;
                return (
                  <div key={sub.id} className="flex items-center gap-2.5 p-3 rounded-md border border-border" dir={dir}>
                    <Avatar name={sub.name} size={32} />
                    <div className="flex-1 min-w-0">
                      <div className="t-body-m truncate">{sub.name}</div>
                      <div className="text-xs text-text-muted">{t('analytics.subscriptions.itemSubtitle', { percent: pct, cycle: formatEnumLabel(sub.billingCycle || sub.cycle) })}</div>
                    </div>
                    <span className="t-body-m font-mono text-negative" dir="ltr">{money.format(cost)}</span>
                  </div>
                );
              })}
            </div>
          )}
          {activeSubscriptions > 0 && (
            <div className="mt-4 pt-4 border-t border-border text-sm text-text-muted">
              {t('analytics.subscriptions.monthlyCost')}<span className="font-mono text-text" dir="ltr">{t('analytics.subscriptions.perMonth', { amount: money.format(activeSubs.reduce((sum, sub) => sum + getMonthlySubscriptionAmount(sub), 0)) })}</span>
            </div>
          )}
        </Card>
      )}

      {/* ── all-time summary ── */}
      <Card pad={22}>
        <SectionHeader title={t('analytics.summary.title')} />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-[1px] bg-border rounded-md overflow-hidden mt-4">
          <SummaryBox label={t('analytics.summary.totalRevenue')} value={moneyLong.format(overview.totalRevenue)} valueClass="text-positive" />
          <SummaryBox label={t('analytics.summary.totalExpenses')} value={moneyLong.format(overview.totalExpenses)} valueClass="text-negative" />
          <SummaryBox label={t('analytics.summary.netProfit')} value={moneyLong.format(overview.netProfit)} valueClass={overview.netProfit >= 0 ? 'text-positive' : 'text-negative'} />
          <SummaryBox label={t('analytics.summary.profitMargin')} value={`${allTimeMargin}%`} valueClass={allTimeMargin >= 0 ? 'text-positive' : 'text-negative'} />
          <SummaryBox label={t('analytics.summary.activeClients')} value={overview.activeClients.toString()} />
          <SummaryBox label={t('analytics.summary.avgClient')} value={moneyLong.format(overview.totalClients > 0 ? overview.totalRevenue / overview.totalClients : 0)} />
          <SummaryBox label={t('analytics.summary.activeTools')} value={activeSubscriptions.toString()} />
          <SummaryBox label={t('analytics.summary.toolsPerMonth')} value={moneyLong.format(overview.subscriptionBurden)} valueClass="text-negative" />
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
      <div className={`t-h2 mt-1.5 ${valueClass}`}>{value}</div>
    </div>
  );
}
