import { formatDate, formatTransactionName } from '@/lib/format';
import { DEFAULT_LOCALE, type Locale } from '@/lib/locales';
import { t as translate } from '@/messages';

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

export const getReportTitle = (type: ReportType, locale: Locale): string => {
  switch (type) {
    case 'pl': return translate(locale, 'reports.types.pl.title');
    case 'transactions': return translate(locale, 'reports.types.transactions.label');
    case 'clients': return translate(locale, 'reports.types.clients.label');
    case 'tax': return translate(locale, 'reports.types.tax.label');
  }
};

const getCategoryLabel = (id: string, locale: Locale) => {
  const keyMap: Record<string, any> = {
    CLIENT: 'reports.categories.client',
    PROJECT: 'reports.categories.project',
    TOOLS: 'reports.categories.tools',
    OPERATIONS: 'reports.categories.operations',
    TAXES: 'reports.categories.taxes',
    OTHER: 'reports.categories.other',
  };
  const key = keyMap[id];
  if (key) return translate(locale, key);
  return id ? id.charAt(0) + id.slice(1).toLowerCase() : translate(locale, 'reports.categories.uncategorized');
};

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
const monthLabel = (key: string, locale: Locale) => {
  const [y, m] = key.split('-').map(Number);
  return formatDate(new Date(y, m - 1, 1), locale, { month: 'short', year: 'numeric' });
};
const dateLabel = (d: Date | string, locale: Locale) => formatDate(new Date(iso(d)), locale, { month: 'short', day: 'numeric', year: 'numeric' });

const inRange = (d: Date | string, from: Date, to: Date) => {
  const t = new Date(iso(d)).getTime();
  return t >= from.getTime() && t <= to.getTime();
};

export function buildReport(
  type: ReportType,
  data: { transactions: Tx[]; clients: ClientRow[] },
  fromStr: string,
  toStr: string,
  locale: Locale = DEFAULT_LOCALE,
): ReportResult {
  const from = new Date(`${fromStr}T00:00:00`);
  const to = new Date(`${toStr}T23:59:59`);
  const txs = data.transactions.filter((t) => t.status === 'COMPLETED' && inRange(t.date, from, to));
  const base = { type, title: getReportTitle(type, locale), range: { from: fromStr, to: toStr } };

  if (type === 'transactions') {
    const rows = [...txs]
      .sort((a, b) => new Date(iso(b.date)).getTime() - new Date(iso(a.date)).getTime())
      .map((t) => [dateLabel(t.date, locale), formatTransactionName(t.name || '—', (k, vars) => translate(locale, k, vars)), t.type === 'INCOME' ? translate(locale, 'reports.values.revenue') : translate(locale, 'reports.values.expense'), getCategoryLabel(t.categoryId, locale), t.type === 'INCOME' ? t.amount : -t.amount]);
    const revenue = txs.filter((t) => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
    const expenses = txs.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
    return {
      ...base,
      columns: [
        { key: 'date', label: translate(locale, 'reports.columns.date') },
        { key: 'name', label: translate(locale, 'reports.columns.itemName') },
        { key: 'type', label: translate(locale, 'reports.columns.type') },
        { key: 'category', label: translate(locale, 'reports.columns.category') },
        { key: 'amount', label: translate(locale, 'reports.columns.amount'), numeric: true },
      ],
      rows,
      summary: [
        { label: translate(locale, 'reports.summary.transactions'), value: txs.length, tone: 'neutral' },
        { label: translate(locale, 'reports.summary.revenue'), value: revenue, tone: 'positive' },
        { label: translate(locale, 'reports.summary.expenses'), value: expenses, tone: 'negative' },
        { label: translate(locale, 'reports.summary.net'), value: revenue - expenses, tone: revenue - expenses >= 0 ? 'positive' : 'negative' },
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
        { key: 'client', label: translate(locale, 'reports.columns.client') },
        { key: 'company', label: translate(locale, 'reports.columns.company') },
        { key: 'count', label: translate(locale, 'reports.columns.payments'), numeric: true },
        { key: 'revenue', label: translate(locale, 'reports.columns.revenue'), numeric: true },
      ],
      rows,
      summary: [
        { label: translate(locale, 'reports.summary.clients'), value: rows.length, tone: 'neutral' },
        { label: translate(locale, 'reports.summary.totalRevenue'), value: total, tone: 'positive' },
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
      .map(([key, v]) => [getCategoryLabel(key.split(':')[1], locale), v.type === 'INCOME' ? translate(locale, 'reports.values.revenue') : translate(locale, 'reports.values.expense'), v.type === 'INCOME' ? v.amount : -v.amount])
      .sort((a, b) => (b[2] as number) - (a[2] as number));
    const revenue = txs.filter((t) => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
    const expenses = txs.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
    return {
      ...base,
      columns: [
        { key: 'category', label: translate(locale, 'reports.columns.category') },
        { key: 'type', label: translate(locale, 'reports.columns.type') },
        { key: 'amount', label: translate(locale, 'reports.columns.amount'), numeric: true },
      ],
      rows,
      summary: [
        { label: translate(locale, 'reports.summary.grossRevenue'), value: revenue, tone: 'positive' },
        { label: translate(locale, 'reports.summary.deductibleExpenses'), value: expenses, tone: 'negative' },
        { label: translate(locale, 'reports.summary.netTaxable'), value: revenue - expenses, tone: revenue - expenses >= 0 ? 'positive' : 'negative' },
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
    .map(([key, v]) => [monthLabel(key, locale), v.revenue, v.expenses, v.revenue - v.expenses]);
  const totalRev = txs.filter((t) => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
  const totalExp = txs.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
  return {
    ...base,
    columns: [
      { key: 'month', label: translate(locale, 'reports.columns.month') },
      { key: 'revenue', label: translate(locale, 'reports.columns.revenue'), numeric: true },
      { key: 'expenses', label: translate(locale, 'reports.columns.expenses'), numeric: true },
      { key: 'net', label: translate(locale, 'reports.columns.net'), numeric: true },
    ],
    rows,
    summary: [
      { label: translate(locale, 'reports.summary.revenue'), value: totalRev, tone: 'positive' },
      { label: translate(locale, 'reports.summary.expenses'), value: totalExp, tone: 'negative' },
      { label: translate(locale, 'reports.summary.netProfit'), value: totalRev - totalExp, tone: totalRev - totalExp >= 0 ? 'positive' : 'negative' },
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
