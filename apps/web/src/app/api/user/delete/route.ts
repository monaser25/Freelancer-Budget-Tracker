import { NextResponse } from 'next/server';
import { authenticateRequest, getUserId } from '@/server/auth';
import { prisma } from '@/server/prisma';
import { withApiError } from '@/server/errors';
import { getSupabaseAuthClient } from '@/server/supabase';
import { isDevAuthEnabled } from '@/lib/devAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Permanently deletes the authenticated user's data and their auth account.
export const DELETE = async (request: Request) => withApiError(request, async () => {
  const user = await authenticateRequest(request);
  const userId = getUserId(user);

  await prisma.$transaction(async (tx) => {
    await tx.notification.deleteMany({ where: { userId } });
    await tx.invoice.deleteMany({ where: { userId } }); // line items cascade
    await tx.transaction.deleteMany({ where: { userId } });
    await tx.budget.deleteMany({ where: { userId } });
    await tx.subscription.deleteMany({ where: { userId } });
    await tx.client.deleteMany({ where: { userId } });
    await tx.category.deleteMany({ where: { userId } });
    await tx.auditLog.deleteMany({ where: { userId } });
    await tx.user.delete({ where: { id: userId } });
  });

  // Remove the Supabase auth account (skip in local dev-auth mode).
  if (!isDevAuthEnabled()) {
    try {
      await getSupabaseAuthClient().auth.admin.deleteUser(userId);
    } catch (err) {
      console.error('Failed to delete Supabase auth user', err);
    }
  }

  return NextResponse.json({ ok: true });
});
