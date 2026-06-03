import { NextResponse } from 'next/server';
import { authenticateRequest, getUserId } from '@/server/auth';
import { prisma } from '@/server/prisma';
import { withApiError } from '@/server/errors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Body: { id?: string }. With an id, marks that one read; without, marks all read.
export const POST = async (request: Request) => withApiError(request, async () => {
  const user = await authenticateRequest(request);
  const userId = getUserId(user);

  const body = await request.json().catch(() => ({}));
  const id = typeof body?.id === 'string' ? body.id : undefined;

  if (id) {
    await prisma.notification.updateMany({ where: { id, userId }, data: { read: true } });
  } else {
    await prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } });
  }

  const unread = await prisma.notification.count({ where: { userId, read: false } });
  return NextResponse.json({ unread });
});
