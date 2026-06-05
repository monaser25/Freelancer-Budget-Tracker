import ExcelJS from 'exceljs';
import type { ReportResult } from './reports';

// Brand palette (ARGB).
const ACCENT = 'FF6D5EFC';
const MUTED = 'FF71717A';
const INK = 'FF18181B';
const POSITIVE = 'FF10B981';
const NEGATIVE = 'FFEF4444';
const HAIRLINE = 'FFEFEFF2';

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
export async function reportToXlsx(report: ReportResult): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Haseeela';
  wb.created = new Date();

  const ws = wb.addWorksheet(report.title.slice(0, 28) || 'Report', {
    pageSetup: { fitToWidth: 1, margins: { left: 0.5, right: 0.5, top: 0.6, bottom: 0.6, header: 0.3, footer: 0.3 } },
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
  ws.getCell('A2').value =
    `${report.title}   ·   ${report.range.from} → ${report.range.to}   ·   Generated ${new Date().toLocaleDateString()}`;
  ws.getCell('A2').font = { name: 'Calibri', size: 10, color: { argb: MUTED } };

  let r = 4;

  // ── Summary block ──
  if (report.summary.length) {
    for (const s of report.summary) {
      const label = ws.getCell(r, 1);
      label.value = s.label;
      label.font = { bold: true, color: { argb: MUTED } };
      const val = ws.getCell(r, 2);
      val.value = s.value;
      val.numFmt = '#,##0.00';
      val.font = {
        bold: true,
        color: { argb: s.tone === 'negative' ? NEGATIVE : s.tone === 'positive' ? POSITIVE : INK },
      };
      r += 1;
    }
    r += 1;
  }

  // ── Table header ──
  const headerRow = ws.getRow(r);
  report.columns.forEach((c, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = c.label;
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ACCENT } };
    cell.alignment = { horizontal: c.numeric ? 'right' : 'left', vertical: 'middle' };
  });
  headerRow.height = 18;
  r += 1;

  // ── Data rows ──
  for (const row of report.rows) {
    const dataRow = ws.getRow(r);
    row.forEach((value, i) => {
      const col = report.columns[i];
      const cell = dataRow.getCell(i + 1);
      cell.value = value as string | number;
      if (col?.numeric && typeof value === 'number') {
        cell.numFmt = '#,##0.00';
        cell.alignment = { horizontal: 'right' };
        if (value < 0) cell.font = { color: { argb: NEGATIVE } };
      }
      cell.border = { bottom: { style: 'hair', color: { argb: HAIRLINE } } };
    });
    r += 1;
  }

  // ── Column widths (fit content, clamped) ──
  report.columns.forEach((c, i) => {
    const maxLen = Math.max(c.label.length, ...report.rows.map((row) => String(row[i] ?? '').length));
    ws.getColumn(i + 1).width = Math.min(Math.max(maxLen + 2, 12), 42);
  });

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
