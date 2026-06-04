'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

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
  return (
    <div className="h-[260px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
          <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} dy={10} />
          <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => formatAmount(Number(v))} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
          <Tooltip
            formatter={(value: number) => formatAmount(value)}
            cursor={{ fill: 'var(--surface-hover)' }}
            contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
          />
          <Bar dataKey="revenue" fill="var(--positive)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="expenses" fill="var(--negative)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
