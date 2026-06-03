import { Prisma } from '@prisma/client';
import type { AuthenticatedUser } from './auth';
import { prisma } from './prisma';

const makeEmail = (userId: string) => {
  const safeId = userId.toLowerCase().replace(/[^a-z0-9._-]/g, '-');
  return `${safeId}@flowledger.local`;
};

export const ensureUser = async (user: AuthenticatedUser) => {
  const userId = user.id;
  const email = user.email || makeEmail(userId);
  const name = user.name?.trim() || email.split('@')[0] || 'Haseela User';
  const existing = await prisma.user.findUnique({ where: { id: userId } });
  if (existing) {
    const data: { email?: string; name?: string } = {};
    if (existing.email !== email) data.email = email;
    if (user.name?.trim() && existing.name !== user.name.trim()) data.name = user.name.trim();
    if (Object.keys(data).length > 0) {
      await prisma.user.update({ where: { id: userId }, data });
    }
    return;
  }

  try {
    await prisma.user.create({
      data: {
        id: userId,
        name,
        email,
        password: 'supabase-auth',
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') return;
    throw err;
  }
};
