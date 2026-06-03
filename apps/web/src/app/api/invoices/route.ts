import { NextResponse } from 'next/server';
import { authenticateRequest, getUserId } from '@/server/auth';
import { prisma } from '@/server/prisma';
import { withApiError } from '@/server/errors';
import { effectiveStatus } from '@/server/invoices';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = async (request: Request) => withApiError(request, async () => {
  const user = await authenticateRequest(request);
  const userId = getUserId(user);

  const invoices = await prisma.invoice.findMany({
    where: { userId },
    orderBy: { issueDate: 'desc' },
    include: {
      lineItems: { orderBy: { position: 'asc' } },
      client: { select: { id: true, name: true, company: true, email: true } },
    },
  });

  // Surface overdue status without mutating stored rows.
  const withStatus = invoices.map((inv) => ({ ...inv, status: effectiveStatus(inv.status, inv.dueDate) }));

  return NextResponse.json({ invoices: withStatus });
});
