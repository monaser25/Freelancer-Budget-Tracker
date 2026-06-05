import { formatDate } from '@/lib/format';
import { DEFAULT_LOCALE } from '@/lib/locales';

type Tx = {
  id: string;
  name: string;
  amount: number;
  type: string;
  status: string;
  date: Date | string;
  categoryId: string;
  clientId: string | null;
  sourceType: string;
  sourceId: string | null;
};

type ClientRow = { id: string; name: string; company: string | null };

export type ReportType = 'pl' | 'transactions' | 'clients' | 'tax';

export const REPORT_TITLES: Record<ReportType, string> = {
  pl: 'Profit & Loss Summary',
  transactions: 'Transactions',
  clients: 'Client Revenue',
  tax: 'Tax Summary',
};

// Categories are stored as short codes (CLIENT, TOOLS, …). Reports must show the
// human label so a row reads "Tools" / "Client Payment" instead of a raw code.
const CATEGORY_LABELS: Record<string, string> = {
  CLIENT: 'Client Payment',
  PROJECT: 'Project Revenue',
  TOOLS: 'Tools',
  OPERATIONS: 'Operations',
  TAXES: 'Taxes',
  OTHER: 'Other',
};
const categoryLabel = (id: string) =>
  CATEGORY_LABELS[id] || (id ? id.charAt(0) + id.slice(1).toLowerCase() : 'Uncategorized');

export interface ReportResult {
  type: ReportType;
  title: string;
  range: { from: string; to: string };
  columns: { key: string; label: string; numeric?: boolean }[];
  rows: (string | number)[][];
  summary: { label: string; value: number; tone?: 'positive' | 'negative' | 'neutral' }[];
}

const iso = (d: Date | string) => (typeof d === 'string' ? d : d.toISOString());
const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
const monthLabel = (key: string) => {
  const [y, m] = key.split('-').map(Number);
  return formatDate(new Date(y, m - 1, 1), DEFAULT_LOCALE, { month: 'short', year: 'numeric' });
};
const dateLabel = (d: Date | string) => formatDate(new Date(iso(d)), DEFAULT_LOCALE, { month: 'short', day: 'numeric', year: 'numeric' });

const inRange = (d: Date | string, from: Date, to: Date) => {
  const t = new Date(iso(d)).getTime();
  return t >= from.getTime() && t <= to.getTime();
};

export function buildReport(
  type: ReportType,
  data: { transactions: Tx[]; clients: ClientRow[] },
  fromStr: string,
  toStr: string,
): ReportResult {
  const from = new Date(`${fromStr}T00:00:00`);
  const to = new Date(`${toStr}T23:59:59`);
  const txs = data.transactions.filter((t) => t.status === 'COMPLETED' && inRange(t.date, from, to));
  const base = { type, title: REPORT_TITLES[type], range: { from: fromStr, to: toStr } };

  if (type === 'transactions') {
    const rows = [...txs]
      .sort((a, b) => new Date(iso(b.date)).getTime() - new Date(iso(a.date)).getTime())
      .map((t) => [dateLabel(t.date), t.name || '—', t.type === 'INCOME' ? 'Revenue' : 'Expense', categoryLabel(t.categoryId), t.type === 'INCOME' ? t.amount : -t.amount]);
    const revenue = txs.filter((t) => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
    const expenses = txs.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
    return {
      ...base,
      columns: [
        { key: 'date', label: 'Date' },
        { key: 'name', label: 'Description' },
        { key: 'type', label: 'Type' },
        { key: 'category', label: 'Category' },
        { key: 'amount', label: 'Amount', numeric: true },
      ],
      rows,
      summary: [
        { label: 'Transactions', value: txs.length, tone: 'neutral' },
        { label: 'Revenue', value: revenue, tone: 'positive' },
        { label: 'Expenses', value: expenses, tone: 'negative' },
        { label: 'Net', value: revenue - expenses, tone: revenue - expenses >= 0 ? 'positive' : 'negative' },
      ],
    };
  }

  if (type === 'clients') {
    const byClient: Record<string, { revenue: number; count: number }> = {};
    for (const t of txs) {
      if (t.type !== 'INCOME') continue;
      const cid = t.clientId || (t.sourceType === 'client' ? t.sourceId : null);
      if (!cid) continue;
      byClient[cid] = byClient[cid] || { revenue: 0, count: 0 };
      byClient[cid].revenue += t.amount;
      byClient[cid].count += 1;
    }
    const rows = data.clients
      .map((c) => ({ c, stat: byClient[c.id] || { revenue: 0, count: 0 } }))
      .filter((r) => r.stat.revenue > 0)
      .sort((a, b) => b.stat.revenue - a.stat.revenue)
      .map((r) => [r.c.name, r.c.company || '—', r.stat.count, r.stat.revenue]);
    const total = rows.reduce((s, r) => s + (r[3] as number), 0);
    return {
      ...base,
      columns: [
        { key: 'client', label: 'Client' },
        { key: 'company', label: 'Company' },
        { key: 'count', label: 'Payments', numeric: true },
        { key: 'revenue', label: 'Revenue', numeric: true },
      ],
      rows,
      summary: [
        { label: 'Clients', value: rows.length, tone: 'neutral' },
        { label: 'Total revenue', value: total, tone: 'positive' },
      ],
    };
  }

  if (type === 'tax') {
    const byCat: Record<string, { type: string; amount: number }> = {};
    for (const t of txs) {
      const key = `${t.type}:${t.categoryId}`;
      byCat[key] = byCat[key] || { type: t.type, amount: 0 };
      byCat[key].amount += t.amount;
    }
    const rows = Object.entries(byCat)
      .map(([key, v]) => [categoryLabel(key.split(':')[1]), v.type === 'INCOME' ? 'Revenue' : 'Expense', v.type === 'INCOME' ? v.amount : -v.amount])
      .sort((a, b) => (b[2] as number) - (a[2] as number));
    const revenue = txs.filter((t) => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
    const expenses = txs.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
    return {
      ...base,
      columns: [
        { key: 'category', label: 'Category' },
        { key: 'type', label: 'Type' },
        { key: 'amount', label: 'Amount', numeric: true },
      ],
      rows,
      summary: [
        { label: 'Gross revenue', value: revenue, tone: 'positive' },
        { label: 'Deductible expenses', value: expenses, tone: 'negative' },
        { label: 'Net (taxable)', value: revenue - expenses, tone: revenue - expenses >= 0 ? 'positive' : 'negative' },
      ],
    };
  }

  // P&L summary grouped by month
  const months: Record<string, { revenue: number; expenses: number }> = {};
  for (const t of txs) {
    const key = monthKey(new Date(iso(t.date)));
    months[key] = months[key] || { revenue: 0, expenses: 0 };
    if (t.type === 'INCOME') months[key].revenue += t.amount;
    else months[key].expenses += t.amount;
  }
  const rows = Object.entries(months)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, v]) => [monthLabel(key), v.revenue, v.expenses, v.revenue - v.expenses]);
  const totalRev = txs.filter((t) => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
  const totalExp = txs.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
  return {
    ...base,
    columns: [
      { key: 'month', label: 'Month' },
      { key: 'revenue', label: 'Revenue', numeric: true },
      { key: 'expenses', label: 'Expenses', numeric: true },
      { key: 'net', label: 'Net', numeric: true },
    ],
    rows,
    summary: [
      { label: 'Revenue', value: totalRev, tone: 'positive' },
      { label: 'Expenses', value: totalExp, tone: 'negative' },
      { label: 'Net profit', value: totalRev - totalExp, tone: totalRev - totalExp >= 0 ? 'positive' : 'negative' },
    ],
  };
}

const csvCell = (v: string | number) => {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function reportToCsv(report: ReportResult): string {
  const header = report.columns.map((c) => csvCell(c.label)).join(',');
  const body = report.rows.map((row) => row.map(csvCell).join(',')).join('\n');
  return `${header}\n${body}`;
}
