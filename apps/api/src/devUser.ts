import { prisma } from './db';
import { Prisma } from '@prisma/client';
import type { AuthenticatedUser } from './auth';

const makeEmail = (userId: string) => {
  const safeId = userId.toLowerCase().replace(/[^a-z0-9._-]/g, '-');
  return `${safeId}@flowledger.local`;
};

export const ensureUser = async (user: AuthenticatedUser) => {
  const userId = user.id;
  const email = user.email || makeEmail(userId);
  const existing = await prisma.user.findUnique({ where: { id: userId } });
  if (existing) {
    if (existing.email !== email) {
      await prisma.user.update({ where: { id: userId }, data: { email } });
    }
    return;
  }

  try {
    await prisma.user.create({
      data: {
        id: userId,
        name: email.split('@')[0] || 'FlowLedger User',
        email,
        password: 'supabase-auth',
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') return;
    throw err;
  }
};
