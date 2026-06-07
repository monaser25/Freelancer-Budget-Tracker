'use client';

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useLocale } from '@/lib/i18n';

type RevenueExpenseRow = {
  label: string;
  revenue: number;
  expenses: number;
};

type CategoryRow = {
  category: string;
  amount: number;
};

export function AnalyticsRevenueExpensesChart({
  data,
  formatAmount,
}: {
  data: RevenueExpenseRow[];
  formatAmount: (value: number) => string;
}) {
  const { t } = useLocale();
  const seriesLabel = (name: string) => name === 'revenue' ? t('analytics.stats.revenue') : t('analytics.stats.expenses');

  return (
    <div className="h-[280px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barGap={4} barCategoryGap="30%" margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} dy={10} />
          <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => formatAmount(Number(v))} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
          <Tooltip
            formatter={(value: number, name: string) => [formatAmount(value), seriesLabel(name)]}
            cursor={{ fill: 'var(--surface-hover)' }}
            contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
          />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} formatter={(v) => seriesLabel(String(v))} />
          <Bar dataKey="revenue" fill="var(--positive)" radius={[4, 4, 0, 0]} name="revenue" />
          <Bar dataKey="expenses" fill="var(--negative)" radius={[4, 4, 0, 0]} name="expenses" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AnalyticsCategoryBarChart({
  data,
  formatAmount,
}: {
  data: CategoryRow[];
  formatAmount: (value: number) => string;
}) {
  return (
    <div className="mt-4">
      <ResponsiveContainer width="100%" height={Math.max(160, data.length * 40)}>
        <BarChart data={data} layout="vertical" margin={{ left: 0, right: 24, top: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
          <XAxis type="number" tickFormatter={(v) => formatAmount(Number(v))} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="category" width={86} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
          <Tooltip
            formatter={(v: number) => formatAmount(v)}
            cursor={{ fill: 'var(--surface-hover)' }}
            contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', fontSize: 12 }}
          />
          <Bar dataKey="amount" fill="var(--accent)" radius={[0, 4, 4, 0]} barSize={20} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
