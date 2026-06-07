'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useLocale } from '@/lib/i18n';

type MonthlyChartRow = {
  key: string;
  month: string;
  revenue: number;
  expenses: number;
};

export function DashboardMonthlyChart({
  data,
  formatAmount,
}: {
  data: MonthlyChartRow[];
  formatAmount: (value: number) => string;
}) {
  const { t, dir } = useLocale();
  // Provide correct margin depending on LTR/RTL so the Y axis doesn't get cut off
  const margin = dir === 'rtl' ? { top: 10, right: 20, left: -20, bottom: 0 } : { top: 10, right: 0, left: -20, bottom: 0 };

  return (
    <div className="h-[260px] w-full mt-4" dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={margin}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
          <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} dy={10} reversed={dir === 'rtl'} />
          <YAxis orientation={dir === 'rtl' ? 'right' : 'left'} tickLine={false} axisLine={false} tickFormatter={(v) => formatAmount(Number(v))} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
          <Tooltip
            cursor={{ fill: 'var(--surface-hover)' }}
            contentStyle={{ backgroundColor: 'var(--surface)', color: 'var(--text)', borderRadius: '8px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
            labelFormatter={(label) => <div className="font-medium mb-1.5" dir={dir}>{label}</div>}
            formatter={(value: number, name: string) => {
              const label = name === 'revenue' ? t('analytics.stats.revenue') : name === 'expenses' ? t('analytics.stats.expenses') : name;
              return [<span key="amt" dir="ltr">{formatAmount(value)}</span>, <span key="lbl" dir={dir}>{label}</span>];
            }}
          />
          <Bar dataKey="revenue" fill="var(--positive)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="expenses" fill="var(--negative)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
