'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

type ClientChartRow = {
  name: string;
  value: number;
};

const colors = ['var(--viz-1)', 'var(--viz-2)', 'var(--viz-3)', 'var(--viz-4)', 'var(--viz-5)'];

export function ClientRevenuePieChart({
  data,
  formatAmount,
}: {
  data: ClientChartRow[];
  formatAmount: (value: number) => string;
}) {
  return (
    <ResponsiveContainer width="100%" height="86%">
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={54} outerRadius={88}>
          {data.map((entry, index) => <Cell key={entry.name} fill={colors[index % colors.length]} />)}
        </Pie>
        <Tooltip formatter={(value) => formatAmount(Number(value))} />
      </PieChart>
    </ResponsiveContainer>
  );
}
