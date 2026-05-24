import { NextResponse } from 'next/server';
import { prisma } from '@/server/prisma';
import { withApiError } from '@/server/errors';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = async (request: Request) => withApiError(request, async () => {
  await prisma.$queryRaw`SELECT 1`;
  return NextResponse.json({ status: 'ok', time: new Date() });
});
