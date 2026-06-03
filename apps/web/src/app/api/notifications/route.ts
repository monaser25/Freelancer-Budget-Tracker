import { NextResponse } from 'next/server';
import { authenticateRequest, getUserId } from '@/server/auth';
import { ensureUser } from '@/server/devUser';
import { prisma } from '@/server/prisma';
import { withApiError } from '@/server/errors';
import { generateNotifications } from '@/server/notifications';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = async (request: Request) => withApiError(request, async () => {
  const user = await authenticateRequest(request);
  const userId = getUserId(user);

  await ensureUser(user);
  await generateNotifications(userId);

  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  const unread = notifications.filter((n) => !n.read).length;

  return NextResponse.json({ notifications, unread });
});
