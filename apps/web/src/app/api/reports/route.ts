import { NextResponse } from 'next/server';
import { authenticateRequest, getUserId } from '@/server/auth';
import { prisma } from '@/server/prisma';
import { withApiError } from '@/server/errors';
import { buildReport, reportToCsv, getReportTitle, type ReportType } from '@/server/reports';
import { reportToXlsx } from '@/server/reportXlsx';
import { DEFAULT_LOCALE, type Locale } from '@/lib/locales';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const isReportType = (v: string): v is ReportType => v === 'pl' || v === 'transactions' || v === 'clients' || v === 'tax';

export const GET = async (request: Request) => withApiError(request, async () => {
  const user = await authenticateRequest(request);
  const userId = getUserId(user);

  const url = new URL(request.url);
  const typeParam = url.searchParams.get('type') || 'pl';
  const type: ReportType = isReportType(typeParam) ? typeParam : 'pl';
  const format = url.searchParams.get('format') || 'json';
  const locale = (url.searchParams.get('locale') as Locale) || DEFAULT_LOCALE;

  const now = new Date();
  const defaultFrom = new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10);
  const from = url.searchParams.get('from') || defaultFrom;
  const to = url.searchParams.get('to') || now.toISOString().slice(0, 10);
  const fromDate = new Date(`${from}T00:00:00`);
  const toDate = new Date(`${to}T23:59:59`);
  const validRange = !Number.isNaN(fromDate.getTime()) && !Number.isNaN(toDate.getTime());

  const [transactions, clients] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        userId,
        deletedAt: null,
        status: 'COMPLETED',
        ...(validRange ? { date: { gte: fromDate, lte: toDate } } : {}),
      },
      select: { id: true, name: true, amount: true, type: true, status: true, date: true, categoryId: true, clientId: true, sourceType: true, sourceId: true },
    }),
    prisma.client.findMany({ where: { userId }, select: { id: true, name: true, company: true } }),
  ]);

  const report = buildReport(type, { transactions, clients }, from, to, locale);

  // The localized title (e.g. Arabic) is used for the human-readable download
  // name, but the localized slug can contain non-Latin1 characters which are
  // illegal in an HTTP header value (Content-Disposition must be a ByteString).
  // We therefore expose the localized name via RFC 5987 `filename*` and keep a
  // plain ASCII `filename` fallback derived from the stable English title.
  const localizedSlug = `${getReportTitle(type, locale).replace(/\s+/g, '-').toLowerCase()}-${from}_to_${to}`;
  const asciiSlug = `${getReportTitle(type, DEFAULT_LOCALE).replace(/\s+/g, '-').toLowerCase()}-${from}_to_${to}`
    .replace(/[^\x20-\x7E]/g, '')
    .replace(/[\\/:*?"<>|]/g, '-');

  const contentDisposition = (ext: string) => {
    const fallback = `${asciiSlug || 'report'}.${ext}`.replace(/"/g, '');
    const utf8 = encodeURIComponent(`${localizedSlug}.${ext}`);
    return `attachment; filename="${fallback}"; filename*=UTF-8''${utf8}`;
  };

  if (format === 'csv') {
    const csv = reportToCsv(report);
    // Prepend a UTF-8 BOM so Excel renders Arabic headers/values correctly.
    return new NextResponse(`﻿${csv}`, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': contentDisposition('csv'),
      },
    });
  }

  if (format === 'xlsx') {
    const buffer = await reportToXlsx(report, locale);
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': contentDisposition('xlsx'),
      },
    });
  }

  return NextResponse.json(report);
});
