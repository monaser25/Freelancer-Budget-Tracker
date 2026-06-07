import ExcelJS from 'exceljs';
import { formatDate } from '@/lib/format';
import { DEFAULT_LOCALE, type Locale, dirFor } from '@/lib/locales';
import { t as translate } from '@/messages';
import type { ReportResult } from './reports';

// Brand palette (ARGB).
const ACCENT = 'FF6D5EFC';
const ACCENT_DARK = 'FF4F46E5';
const MUTED = 'FF71717A';
const INK = 'FF18181B';
const POSITIVE = 'FF10B981';
const NEGATIVE = 'FFEF4444';
const HAIRLINE = 'FFEFEFF2';
const ZEBRA = 'FFF7F7FB';
const TINT = 'FFF1EFFE';

const colLetter = (n: number) => {
  let s = '';
  let x = n;
  while (x > 0) {
    const m = (x - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    x = Math.floor((x - 1) / 26);
  }
  return s;
};

/** Render a report into a branded, styled .xlsx workbook (returned as a Buffer). */
export async function reportToXlsx(report: ReportResult, locale: Locale = DEFAULT_LOCALE): Promise<Buffer> {
  const isRtl = dirFor(locale) === 'rtl';
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Haseeela';
  wb.created = new Date();

  const ws = wb.addWorksheet(report.title.slice(0, 28) || translate(locale, 'reports.ui.fallbackReport'), {
    pageSetup: { fitToWidth: 1, margins: { left: 0.5, right: 0.5, top: 0.6, bottom: 0.6, header: 0.3, footer: 0.3 } },
    views: [{ showGridLines: false, rightToLeft: isRtl }],
  });

  const colCount = Math.max(report.columns.length, 2);
  const lastCol = colLetter(colCount);

  // ── Branded header ──
  ws.mergeCells(`A1:${lastCol}1`);
  const title = ws.getCell('A1');
  title.value = 'Haseeela';
  title.font = { name: 'Calibri', size: 18, bold: true, color: { argb: ACCENT } };
  ws.getRow(1).height = 26;

  ws.mergeCells(`A2:${lastCol}2`);
  const generatedStr = translate(locale, 'reports.ui.generated', { date: formatDate(new Date(), locale) }) as string;
  ws.getCell('A2').value =
    `${report.title}   ·   ${report.range.from} → ${report.range.to}   ·   ${generatedStr}`;
  ws.getCell('A2').font = { name: 'Calibri', size: 10, color: { argb: MUTED } };

  let r = 4;

  // ── Summary block ──
  if (report.summary.length) {
    for (const s of report.summary) {
      const label = ws.getCell(r, 1);
      label.value = s.label;
      label.font = { bold: true, color: { argb: MUTED } };
      label.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: TINT } };
      const val = ws.getCell(r, 2);
      val.value = s.value;
      val.numFmt = '#,##0.00';
      val.font = {
        bold: true,
        color: { argb: s.tone === 'negative' ? NEGATIVE : s.tone === 'positive' ? POSITIVE : INK },
      };
      val.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: TINT } };
      val.alignment = { horizontal: isRtl ? 'left' : 'right' };
      ws.getRow(r).height = 17;
      r += 1;
    }
    r += 1;
  }

  // ── Table header ──
  const headerRowIndex = r;
  const headerRow = ws.getRow(r);
  report.columns.forEach((c, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = c.label;
    cell.font = { name: 'Calibri', bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ACCENT } };
    cell.alignment = { horizontal: c.numeric ? (isRtl ? 'left' : 'right') : (isRtl ? 'right' : 'left'), vertical: 'middle' };
    cell.border = { bottom: { style: 'thin', color: { argb: ACCENT_DARK } } };
  });
  headerRow.height = 20;
  r += 1;

  // ── Data rows (zebra striped) ──
  const firstDataRow = r;
  report.rows.forEach((row, rowIdx) => {
    const dataRow = ws.getRow(r);
    const zebra = rowIdx % 2 === 1;
    report.columns.forEach((col, i) => {
      const value = row[i];
      const cell = dataRow.getCell(i + 1);
      cell.value = value as string | number;
      cell.font = { name: 'Calibri', color: { argb: INK } };
      cell.alignment = { horizontal: col?.numeric ? (isRtl ? 'left' : 'right') : (isRtl ? 'right' : 'left'), vertical: 'middle' };
      if (col?.numeric && typeof value === 'number') {
        cell.numFmt = '#,##0.00';
        if (value < 0) cell.font = { name: 'Calibri', color: { argb: NEGATIVE } };
      }
      if (zebra) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ZEBRA } };
      cell.border = { bottom: { style: 'hair', color: { argb: HAIRLINE } } };
    });
    dataRow.height = 16;
    r += 1;
  });

  // ── Totals row for numeric columns ──
  if (report.rows.length) {
    const totalRow = ws.getRow(r);
    report.columns.forEach((col, i) => {
      const cell = totalRow.getCell(i + 1);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: TINT } };
      cell.border = { top: { style: 'thin', color: { argb: ACCENT } } };
      if (i === 0) {
        cell.value = translate(locale, 'reports.values.total');
        cell.font = { name: 'Calibri', bold: true, color: { argb: INK } };
      } else if (col?.numeric) {
        const sum = report.rows.reduce((acc, row) => acc + (typeof row[i] === 'number' ? (row[i] as number) : 0), 0);
        cell.value = sum;
        cell.numFmt = '#,##0.00';
        cell.alignment = { horizontal: isRtl ? 'left' : 'right' };
        cell.font = { name: 'Calibri', bold: true, color: { argb: sum < 0 ? NEGATIVE : INK } };
      }
    });
    totalRow.height = 18;
    r += 1;
  }

  // Freeze the header and let the user filter/sort the table.
  ws.views = [{ state: 'frozen', ySplit: headerRowIndex, showGridLines: false, rightToLeft: isRtl }];
  if (report.rows.length) {
    ws.autoFilter = { from: { row: headerRowIndex, column: 1 }, to: { row: firstDataRow - 1 + report.rows.length, column: colCount } };
  }

  // ── Column widths (fit content, clamped) ──
  report.columns.forEach((c, i) => {
    const maxLen = Math.max(c.label.length, ...report.rows.map((row) => String(row[i] ?? '').length));
    ws.getColumn(i + 1).width = Math.min(Math.max(maxLen + 2, 12), 42);
  });

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
