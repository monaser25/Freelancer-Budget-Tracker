import { formatDate } from '@/lib/format';
import { DEFAULT_LOCALE } from '@/lib/locales';
import { prisma } from '@/server/prisma';

const DAY = 24 * 60 * 60 * 1000;
const fmtDate = (d: Date) => formatDate(d, DEFAULT_LOCALE, { month: 'short', day: 'numeric' });

/**
 * Compute reminder notifications from the user's current data and insert any
 * that don't already exist (deduped via the unique (userId, refKey) index).
 * Idempotent — safe to call on every notifications load and from a cron job.
 */
export const generateNotifications = async (userId: string) => {
  const now = new Date();
  const soon = new Date(now.getTime() + 3 * DAY);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { notifyBillingReminders: true, notifyInvoiceDue: true },
  });

  const wantBilling = user?.notifyBillingReminders ?? true;
  const wantInvoice = user?.notifyInvoiceDue ?? true;

  const pending: { type: string; title: string; body?: string; link?: string; refKey: string; userId: string }[] = [];

  if (wantBilling) {
    const subs = await prisma.subscription.findMany({
      where: { userId, status: 'ACTIVE', archivedAt: null, nextBillingDate: { lte: soon } },
    });
    for (const s of subs) {
      const due = new Date(s.nextBillingDate);
      pending.push({
        type: 'BILLING_DUE',
        title: `${s.name} renews ${fmtDate(due)}`,
        body: 'A subscription payment is coming up.',
        link: '/subscriptions',
        refKey: `billing-sub:${s.id}:${due.toISOString().slice(0, 10)}`,
        userId,
      });
    }

    const clients = await prisma.client.findMany({
      where: { userId, status: 'ACTIVE', archivedAt: null, paymentType: 'retainer', nextBillingDate: { lte: soon, not: null } },
    });
    for (const c of clients) {
      if (!c.nextBillingDate) continue;
      const due = new Date(c.nextBillingDate);
      pending.push({
        type: 'BILLING_DUE',
        title: `${c.name} retainer due ${fmtDate(due)}`,
        body: 'A client payment is coming up.',
        link: '/clients',
        refKey: `billing-client:${c.id}:${due.toISOString().slice(0, 10)}`,
        userId,
      });
    }
  }

  if (wantInvoice) {
    const invoices = await prisma.invoice.findMany({
      where: { userId, status: 'SENT', dueDate: { lt: now } },
    });
    for (const inv of invoices) {
      pending.push({
        type: 'INVOICE_OVERDUE',
        title: `Invoice ${inv.number} is overdue`,
        body: `Was due ${fmtDate(new Date(inv.dueDate))}.`,
        link: '/invoices',
        refKey: `invoice-overdue:${inv.id}`,
        userId,
      });
    }
  }

  if (pending.length > 0) {
    await prisma.notification.createMany({ data: pending, skipDuplicates: true });
  }
};
