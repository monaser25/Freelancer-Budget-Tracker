'use client';

import { useEffect, useMemo, useState } from 'react';
import { useFinancialStore } from '@/store/financialStore';
import { loadReportAPI, downloadReportCsv, type ReportData } from '@/services/financialApi';
import { makeCurrencyFormatter } from '@/lib/currency';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Field, Input, Segmented } from '@/components/ui/Form';
import { Icon } from '@/components/ui/Icon';
import { Skeleton } from '@/components/ui/Skeleton';
import { InlineAlert } from '@/components/ui/InlineAlert';

const REPORT_TYPES = [
  { id: 'pl', label: 'P&L Summary', icon: 'trendingUp', desc: 'Revenue, expenses and net by month' },
  { id: 'transactions', label: 'Transactions', icon: 'walletCards', desc: 'Every entry in the period' },
  { id: 'clients', label: 'Client Revenue', icon: 'users', desc: 'Income ranked by client' },
  { id: 'tax', label: 'Tax Summary', icon: 'fileBarChart', desc: 'Taxable income by category' },
];

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const startOfMonth = () => { const d = new Date(); return iso(new Date(d.getFullYear(), d.getMonth(), 1)); };
const startOfQuarter = () => { const d = new Date(); return iso(new Date(d.getFullYear(), Math.floor(d.getMonth() / 3) * 3, 1)); };
const startOfYear = () => iso(new Date(new Date().getFullYear(), 0, 1));
const todayStr = () => iso(new Date());

export default function ReportsPage() {
  const { currency, transactions } = useFinancialStore();
  const { toast } = useToast();

  // "All time" should start at the first recorded transaction, not an arbitrary
  // year 2000 — keeps the range meaningful and the printed header tidy.
  const earliestTxDate = useMemo(() => {
    const dates = transactions
      .map((t) => t.date)
      .filter(Boolean)
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    return dates.length > 0 ? iso(new Date(dates[0])) : startOfYear();
  }, [transactions]);
  const [type, setType] = useState('pl');
  const [from, setFrom] = useState(startOfYear());
  const [to, setTo] = useState(todayStr());
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const money = useMemo(() => makeCurrencyFormatter(currency, { maximumFractionDigits: 0 }), [currency]);
  const money2 = useMemo(() => makeCurrencyFormatter(currency, { minimumFractionDigits: 2 }), [currency]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    loadReportAPI(type, from, to)
      .then((r) => { if (!cancelled) setReport(r); })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to generate report'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [type, from, to]);

  const setPreset = (preset: string) => {
    if (preset === 'month') setFrom(startOfMonth());
    else if (preset === 'quarter') setFrom(startOfQuarter());
    else if (preset === 'year') setFrom(startOfYear());
    else if (preset === 'all') setFrom(earliestTxDate);
    setTo(todayStr());
  };

  const exportCsv = async () => {
    setExporting(true);
    try {
      const { blob, filename } = await downloadReportCsv(type, from, to);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast('Report exported');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Export failed', 'error');
    } finally {
      setExporting(false);
    }
  };

  const fmtCell = (val: string | number, numeric?: boolean) =>
    numeric && typeof val === 'number' ? money2.format(val) : String(val);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="t-h1">Reports</h1>
        <p className="t-body text-text-muted mt-1">Generate & export financial statements</p>
      </div>

      {/* Report type cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 print:hidden">
        {REPORT_TYPES.map((r) => {
          const active = type === r.id;
          return (
            <button
              key={r.id}
              onClick={() => setType(r.id)}
              className={`text-left p-4 rounded-lg border transition-colors focus-ring ${active ? 'border-accent bg-accent-tint' : 'border-border bg-surface hover:bg-surface-hover'}`}
            >
              <span className={`inline-flex w-9 h-9 rounded-md items-center justify-center mb-2 ${active ? 'bg-accent text-white' : 'bg-surface-hover text-text-secondary'}`}>
                <Icon name={r.icon} size={18} />
              </span>
              <div className={`t-body-m ${active ? 'text-accent' : ''}`}>{r.label}</div>
              <div className="t-small text-text-muted mt-0.5">{r.desc}</div>
            </button>
          );
        })}
      </div>

      {/* Controls */}
      <Card pad={18} className="flex flex-col sm:flex-row sm:items-end gap-4 flex-wrap print:hidden">
        <div className="flex flex-col gap-1.5">
          <span className="t-body-m text-text-secondary">Period</span>
          <Segmented
            value=""
            onChange={setPreset}
            options={[{ value: 'month', label: 'Month' }, { value: 'quarter', label: 'Quarter' }, { value: 'year', label: 'Year' }, { value: 'all', label: 'All time' }]}
          />
        </div>
        <Field label="From" className="w-[150px]"><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></Field>
        <Field label="To" className="w-[150px]"><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></Field>
        <div className="flex-1" />
        <div className="flex gap-2">
          <Button variant="secondary" icon="printer" onClick={() => window.print()} disabled={!report || report.rows.length === 0}>Print / PDF</Button>
          <Button icon="download" loading={exporting} onClick={exportCsv} disabled={!report || report.rows.length === 0}>Export CSV</Button>
        </div>
      </Card>

      {error && <InlineAlert tone="negative" title="Couldn't generate report" body={error} />}

      {/* Preview */}
      <div id="report-document">
        <Card pad={0}>
          <div className="px-5 py-4 border-b border-border flex items-center justify-between flex-wrap gap-2">
            <div>
              <div className="t-h3">{report?.title || 'Report'}</div>
              <div className="t-small text-text-muted tnum">{from} → {to}</div>
            </div>
          </div>

          {/* Summary */}
          {report && report.summary.length > 0 && (
            <div className="px-5 py-4 border-b border-border grid grid-cols-2 sm:grid-cols-4 gap-4">
              {report.summary.map((s) => (
                <div key={s.label}>
                  <div className="t-caption text-text-muted">{s.label}</div>
                  <div className={`t-h3 tnum ${s.tone === 'positive' ? 'text-positive' : s.tone === 'negative' ? 'text-negative' : ''}`}>
                    {Number.isInteger(s.value) && Math.abs(s.value) < 1000 && s.label.match(/clients|transactions|payments/i) ? s.value : money.format(s.value)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {loading ? (
            <div className="p-5 flex flex-col gap-2">{[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-9 w-full" />)}</div>
          ) : !report || report.rows.length === 0 ? (
            <div className="py-14 text-center text-text-muted">
              <Icon name="fileBarChart" size={32} className="mx-auto mb-3 opacity-50" />
              <p className="t-body">No data in this period.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    {report.columns.map((c) => (
                      <th key={c.key} className={`px-5 py-2.5 t-caption text-text-muted ${c.numeric ? 'text-right' : 'text-left'}`}>{c.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {report.rows.map((row, i) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      {row.map((cell, j) => {
                        const col = report.columns[j];
                        const isNeg = col.numeric && typeof cell === 'number' && cell < 0;
                        const isPos = col.numeric && typeof cell === 'number' && cell > 0 && (col.key === 'revenue' || col.key === 'amount' || col.key === 'net');
                        return (
                          <td key={j} className={`px-5 py-2.5 t-body ${col.numeric ? 'text-right tnum' : ''} ${isNeg ? 'text-negative' : isPos ? 'text-positive' : ''}`}>
                            {fmtCell(cell, col.numeric)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
