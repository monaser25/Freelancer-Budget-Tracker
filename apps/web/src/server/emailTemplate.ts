/**
 * Branded, email-client-safe HTML wrapper for all Haseeela emails.
 * Uses tables + inline styles only (no external CSS / web fonts) so it renders
 * consistently in Gmail, Outlook, Apple Mail, etc.
 */

const ACCENT = '#6D5EFC';
const ACCENT_DARK = '#5B4FE0';
const INK = '#18181B';
const MUTED = '#71717A';
const BORDER = '#E7E7EC';
const PAGE_BG = '#F4F4F6';

export const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export type BrandedEmailOptions = {
  /** Hidden inbox preview text. */
  preheader?: string;
  heading: string;
  /** Body paragraphs (plain text; newlines become <br>). */
  intro: string;
  /** Optional key/value rows rendered as a bordered detail card. */
  detailRows?: { label: string; value: string; strong?: boolean }[];
  cta?: { label: string; url: string };
  footnote?: string;
};

const paragraphs = (text: string) =>
  text
    .split('\n\n')
    .map(
      (p) =>
        `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:${INK};">${escapeHtml(p).replace(/\n/g, '<br>')}</p>`,
    )
    .join('');

export const renderBrandedEmail = (o: BrandedEmailOptions): string => {
  const detail = o.detailRows?.length
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 18px;border:1px solid ${BORDER};border-radius:10px;border-collapse:separate;overflow:hidden;">
        ${o.detailRows
          .map(
            (r, i) => `<tr>
              <td style="padding:11px 16px;font-size:13px;color:${MUTED};${i ? `border-top:1px solid ${BORDER};` : ''}">${escapeHtml(r.label)}</td>
              <td style="padding:11px 16px;font-size:14px;text-align:right;color:${INK};font-weight:${r.strong ? 700 : 500};${i ? `border-top:1px solid ${BORDER};` : ''}">${escapeHtml(r.value)}</td>
            </tr>`,
          )
          .join('')}
      </table>`
    : '';

  const cta = o.cta
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 6px;">
        <tr><td style="border-radius:10px;background:${ACCENT};">
          <a href="${escapeHtml(o.cta.url)}" style="display:inline-block;padding:12px 24px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;background:${ACCENT};border:1px solid ${ACCENT_DARK};">${escapeHtml(o.cta.label)}</a>
        </td></tr>
      </table>`
    : '';

  const footnote = o.footnote
    ? `<p style="margin:18px 0 0;font-size:12px;line-height:1.6;color:${MUTED};">${escapeHtml(o.footnote)}</p>`
    : '';

  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"></head>
<body style="margin:0;padding:0;background:${PAGE_BG};">
  ${o.preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(o.preheader)}</div>` : ''}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAGE_BG};padding:28px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid ${BORDER};border-radius:16px;overflow:hidden;">
        <!-- Brand header -->
        <tr><td style="background:${ACCENT};padding:22px 28px;">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td style="width:34px;height:34px;background:rgba(255,255,255,.18);border-radius:9px;text-align:center;vertical-align:middle;font-size:18px;font-weight:700;color:#ffffff;font-family:Arial,Helvetica,sans-serif;">H</td>
            <td style="padding-left:11px;font-family:Arial,Helvetica,sans-serif;color:#ffffff;font-size:18px;font-weight:700;letter-spacing:-.02em;">Haseeela</td>
          </tr></table>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:28px;font-family:Arial,Helvetica,sans-serif;">
          <h1 style="margin:0 0 14px;font-size:20px;line-height:1.3;color:${INK};font-weight:700;">${escapeHtml(o.heading)}</h1>
          ${paragraphs(o.intro)}
          ${detail}
          ${cta}
          ${footnote}
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:18px 28px;border-top:1px solid ${BORDER};font-family:Arial,Helvetica,sans-serif;">
          <p style="margin:0;font-size:12px;line-height:1.6;color:${MUTED};">Haseeela · Freelance finance, organised.<br>This message was sent by your Haseeela workspace.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
};
