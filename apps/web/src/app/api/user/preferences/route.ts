import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateRequest, getUserId } from '@/server/auth';
import { ensureUser } from '@/server/devUser';
import { prisma } from '@/server/prisma';
import { withApiError } from '@/server/errors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const select = {
  name: true,
  email: true,
  currency: true,
  onboardedAt: true,
  notifyBillingReminders: true,
  notifyInvoiceDue: true,
  notifyWeeklySummary: true,
} as const;

export const GET = async (request: Request) => withApiError(request, async () => {
  const user = await authenticateRequest(request);
  const userId = getUserId(user);
  await ensureUser(user);
  const prefs = await prisma.user.findUnique({ where: { id: userId }, select });
  return NextResponse.json(prefs);
});

const PrefsSchema = z.object({
  name: z.string().trim().min(1).optional(),
  currency: z.enum(['USD', 'EUR', 'GBP', 'EGP', 'SAR', 'AED']).optional(),
  onboardedAt: z.string().datetime().nullable().optional(),
  notifyBillingReminders: z.boolean().optional(),
  notifyInvoiceDue: z.boolean().optional(),
  notifyWeeklySummary: z.boolean().optional(),
});

export const PATCH = async (request: Request) => withApiError(request, async () => {
  const user = await authenticateRequest(request);
  const userId = getUserId(user);
  await ensureUser(user);
  const data = PrefsSchema.parse(await request.json());

  const prefs = await prisma.user.update({
    where: { id: userId },
    data: {
      ...data,
      onboardedAt: data.onboardedAt === undefined ? undefined : data.onboardedAt ? new Date(data.onboardedAt) : null,
    },
    select,
  });
  return NextResponse.json(prefs);
});
