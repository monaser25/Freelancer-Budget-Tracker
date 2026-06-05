import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';

export type InvoicePdfData = {
  number: string;
  status: string;
  currency: string;
  issueDate: Date | string;
  dueDate: Date | string;
  paidAt?: Date | string | null;
  client?: { name?: string | null; company?: string | null; email?: string | null } | null;
  lineItems: { description: string; quantity: number; rate: number }[];
  taxRate: number;
  discount: number;
  notes?: string | null;
  terms?: string | null;
  fromName?: string;
  fromEmail?: string;
};

// Brand palette as pdf-lib rgb (0–1).
const ACCENT = rgb(0.427, 0.369, 0.988); // #6D5EFC
const INK = rgb(0.094, 0.094, 0.106); // #18181B
const MUTED = rgb(0.443, 0.443, 0.478); // #71717A
const BORDER = rgb(0.906, 0.906, 0.925); // #E7E7EC
const WHITE = rgb(1, 1, 1);
const POSITIVE = rgb(0.063, 0.725, 0.506);

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MX = 48; // horizontal margin
const RIGHT = PAGE_W - MX;

const fmtDate = (v: Date | string) => {
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// pdf-lib's standard fonts use WinAnsi (CP1252) and throw on anything they
// can't encode (Arabic, emoji, some Intl currency output → U+FFFD). Sanitise
// every string before measuring/drawing so a PDF is always produced.
const sanitize = (value: string): string =>
  (value ?? '')
    .replace(/[     ⁠]/g, ' ') // exotic spaces → normal space
    .replace(/[‘’′]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/…/g, '...')
    // strip anything outside printable ASCII + Latin-1 supplement + €/•
    .replace(/[^\t\n\r\x20-\x7E¡-ÿ€•]/g, '');

// ASCII/WinAnsi-safe currency symbols (no ICU dependency, so no U+FFFD).
const SYMBOLS: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', JPY: '¥', AUD: '$', CAD: '$' };
const makeMoney = (currency: string) => {
  const nf = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const code = (currency || 'USD').toUpperCase();
  const sym = SYMBOLS[code];
  return (n: number) => {
    const amount = nf.format(Number.isFinite(n) ? n : 0);
    return sym ? `${sym}${amount}` : `${code} ${amount}`;
  };
};

// Trim a string to fit a max width, adding an ellipsis if needed (sanitised).
const ellipsize = (text: string, font: PDFFont, size: number, maxW: number) => {
  let t = sanitize(text);
  if (font.widthOfTextAtSize(t, size) <= maxW) return t;
  while (t.length > 1 && font.widthOfTextAtSize(`${t}...`, size) > maxW) t = t.slice(0, -1);
  return `${t}...`;
};

export async function buildInvoicePdf(data: InvoicePdfData): Promise<Buffer> {
  const money = makeMoney(data.currency);
  const items = data.lineItems.map((li) => ({
    ...li,
    amount: (Number(li.quantity) || 0) * (Number(li.rate) || 0),
  }));
  const subtotal = items.reduce((s, li) => s + li.amount, 0);
  const discounted = Math.max(0, subtotal - (Number(data.discount) || 0));
  const taxAmount = discounted * ((Number(data.taxRate) || 0) / 100);
  const total = discounted + taxAmount;

  const doc = await PDFDocument.create();
  doc.setTitle(`Invoice ${data.number}`);
  doc.setProducer('Haseeela');
  const page: PDFPage = doc.addPage([PAGE_W, PAGE_H]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  // Sanitising draw helpers — every string the PDF renders goes through these.
  const put: typeof page.drawText = (text, options) => page.drawText(sanitize(String(text)), options);
  const right = (text: string, xRight: number, y: number, size: number, f: PDFFont, color = INK) => {
    const safe = sanitize(text);
    page.drawText(safe, { x: xRight - f.widthOfTextAtSize(safe, size), y, size, font: f, color });
  };

  // ── Brand header band ──
  const headerH = 92;
  page.drawRectangle({ x: 0, y: PAGE_H - headerH, width: PAGE_W, height: headerH, color: ACCENT });
  // Logo badge
  page.drawRectangle({ x: MX, y: PAGE_H - 58, width: 30, height: 30, color: rgb(1, 1, 1), opacity: 0.18 });
  put('H', { x: MX + 9, y: PAGE_H - 51, size: 18, font: bold, color: WHITE });
  put(data.fromName || 'Haseeela', { x: MX + 42, y: PAGE_H - 50, size: 18, font: bold, color: WHITE });
  if (data.fromEmail) put(data.fromEmail, { x: MX + 42, y: PAGE_H - 66, size: 10, font, color: WHITE, opacity: 0.85 });
  // INVOICE + number (right)
  right('INVOICE', RIGHT, PAGE_H - 46, 22, bold, WHITE);
  right(data.number || '—', RIGHT, PAGE_H - 66, 12, font, WHITE);

  // ── Meta: billed-to + dates/status ──
  let y = PAGE_H - headerH - 40;
  put('BILLED TO', { x: MX, y, size: 9, font: bold, color: MUTED });
  put(data.client?.name || '—', { x: MX, y: y - 17, size: 13, font: bold, color: INK });
  let by = y - 32;
  if (data.client?.company) { put(data.client.company, { x: MX, y: by, size: 11, font, color: INK }); by -= 14; }
  if (data.client?.email) { put(data.client.email, { x: MX, y: by, size: 11, font, color: MUTED }); by -= 14; }

  // dates / status (right column)
  const rcol = RIGHT;
  right('ISSUE DATE', rcol, y, 9, bold, MUTED);
  right(fmtDate(data.issueDate), rcol, y - 15, 11, font, INK);
  right('DUE DATE', rcol, y - 34, 9, bold, MUTED);
  right(fmtDate(data.dueDate), rcol, y - 49, 11, font, INK);
  const statusLabel = (data.status || 'DRAFT').toUpperCase();
  right('STATUS', rcol, y - 68, 9, bold, MUTED);
  right(statusLabel, rcol, y - 83, 11, bold, statusLabel === 'PAID' ? POSITIVE : ACCENT);

  // ── Line items table ──
  y = Math.min(by, y - 83) - 34;
  const colQty = RIGHT - 200;
  const colRate = RIGHT - 110;
  const colAmt = RIGHT;
  // header band
  page.drawRectangle({ x: MX, y: y - 6, width: RIGHT - MX, height: 24, color: ACCENT });
  put('DESCRIPTION', { x: MX + 10, y, size: 9, font: bold, color: WHITE });
  right('QTY', colQty, y, 9, bold, WHITE);
  right('RATE', colRate, y, 9, bold, WHITE);
  right('AMOUNT', colAmt - 10, y, 9, bold, WHITE);
  y -= 30;

  if (items.length === 0) {
    put('No line items.', { x: MX + 10, y, size: 11, font, color: MUTED });
    y -= 20;
  }
  for (const li of items) {
    if (y < 170) break; // keep one page; totals/footer need room
    put(ellipsize(li.description || 'Item', font, 11, colQty - MX - 30), { x: MX + 10, y, size: 11, font, color: INK });
    right(String(li.quantity ?? ''), colQty, y, 11, font, INK);
    right(money(li.rate || 0), colRate, y, 11, font, INK);
    right(money(li.amount), colAmt - 10, y, 11, bold, INK);
    y -= 12;
    page.drawLine({ start: { x: MX, y: y + 2 }, end: { x: RIGHT, y: y + 2 }, thickness: 0.5, color: BORDER });
    y -= 14;
  }

  // ── Totals ──
  y -= 8;
  const tLabelX = RIGHT - 200;
  const totalsRow = (label: string, value: string, strong = false) => {
    put(label, { x: tLabelX, y, size: 11, font: strong ? bold : font, color: strong ? INK : MUTED });
    right(value, RIGHT, y, strong ? 13 : 11, strong ? bold : font, INK);
    y -= strong ? 20 : 16;
  };
  totalsRow('Subtotal', money(subtotal));
  if (Number(data.discount) > 0) totalsRow('Discount', `-${money(Number(data.discount))}`);
  if (Number(data.taxRate) > 0) totalsRow(`Tax (${data.taxRate}%)`, money(taxAmount));
  page.drawLine({ start: { x: tLabelX, y: y + 6 }, end: { x: RIGHT, y: y + 6 }, thickness: 1, color: BORDER });
  totalsRow('Total', money(total), true);

  // ── Notes / Terms ──
  if (data.notes || data.terms) {
    y -= 6;
    page.drawLine({ start: { x: MX, y }, end: { x: RIGHT, y }, thickness: 0.5, color: BORDER });
    y -= 18;
    const block = (title: string, body: string) => {
      put(title.toUpperCase(), { x: MX, y, size: 9, font: bold, color: MUTED });
      y -= 14;
      for (const line of body.split('\n')) {
        if (y < 60) break;
        put(ellipsize(line, font, 10, RIGHT - MX), { x: MX, y, size: 10, font, color: INK });
        y -= 13;
      }
      y -= 6;
    };
    if (data.notes) block('Notes', data.notes);
    if (data.terms) block('Terms', data.terms);
  }

  // ── Footer ──
  put('Generated by Haseeela', { x: MX, y: 40, size: 9, font, color: MUTED });
  right(`Generated ${new Date().toLocaleDateString('en-US')}`, RIGHT, 40, 9, font, MUTED);

  const bytes = await doc.save();
  return Buffer.from(bytes);
}
