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
  const name = user.name?.trim() || email.split('@')[0] || 'Haseeela User';
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

  // No workspace row exists for this auth id yet. If the email is already taken
  // by a DIFFERENT (stale) row — e.g. the Supabase account was deleted and then
  // re-created with the same email, giving it a brand-new auth id — adopt that
  // existing workspace by re-pointing it to the current id. All `userId`
  // foreign keys are ON UPDATE CASCADE, so existing data (transactions,
  // clients, …) moves with it.
  //
  // Without this, `prisma.user.create` below hits the unique-email constraint
  // (P2002) and used to be swallowed silently — leaving NO row for `userId`, so
  // every later write failed the userId foreign key (P2003) and surfaced as a
  // 500 "Internal server error".
  const existingByEmail = await prisma.user.findUnique({ where: { email } });
  if (existingByEmail && existingByEmail.id !== userId) {
    await prisma.user.update({ where: { email }, data: { id: userId } });
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
    // Lost a race to a concurrent create for the same id/email — the row exists
    // now, so treat it as success.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') return;
    throw err;
  }
};
