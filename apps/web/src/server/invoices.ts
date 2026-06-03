import type { Prisma, PrismaClient } from '@prisma/client';

type LineItemInput = { description: string; quantity: number; rate: number };

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/** Compute subtotal, tax, and total from line items + tax rate (%) + discount. */
export const computeInvoiceTotals = (lineItems: LineItemInput[], taxRate: number, discount: number) => {
  const items = lineItems.map((li, i) => ({
    description: li.description,
    quantity: li.quantity,
    rate: li.rate,
    amount: round2(li.quantity * li.rate),
    position: i,
  }));
  const subtotal = round2(items.reduce((sum, li) => sum + li.amount, 0));
  const discounted = Math.max(0, round2(subtotal - discount));
  const taxAmount = round2(discounted * (taxRate / 100));
  const total = round2(discounted + taxAmount);
  return { items, subtotal, taxAmount, total };
};

type TxClient = PrismaClient | Prisma.TransactionClient;

/** Generate the next sequential invoice number for a user, e.g. INV-0004. */
export const nextInvoiceNumber = async (tx: TxClient, userId: string) => {
  const count = await tx.invoice.count({ where: { userId } });
  let n = count + 1;
  // Avoid collisions if numbers were deleted/skipped.
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const candidate = `INV-${String(n).padStart(4, '0')}`;
    const existing = await tx.invoice.findFirst({ where: { userId, number: candidate }, select: { id: true } });
    if (!existing) return candidate;
    n += 1;
  }
};

/** Derive the effective status: a SENT invoice past its due date reads as OVERDUE. */
export const effectiveStatus = (status: string, dueDate: Date | string): string => {
  if (status !== 'SENT') return status;
  const due = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
  return due.getTime() < Date.now() ? 'OVERDUE' : 'SENT';
};
