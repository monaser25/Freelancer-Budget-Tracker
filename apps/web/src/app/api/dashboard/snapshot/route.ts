import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth';
import { withApiError } from '@/server/errors';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = async (request: Request) => withApiError(request, async () => {
  await authenticateRequest(request);
  return NextResponse.json(
    { error: 'Snapshot sync is deprecated. Use individual CRUD endpoints instead.' },
    { status: 410 },
  );
});
