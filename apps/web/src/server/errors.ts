import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';

export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    Object.setPrototypeOf(this, HttpError.prototype);
    this.statusCode = statusCode;
  }
}

const formatZodError = (error: ZodError) => {
  return error.issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
  }));
};

const requestPath = (request: Request) => {
  try {
    return new URL(request.url).pathname;
  } catch {
    return request.url;
  }
};

export const handleApiError = (err: unknown, request: Request) => {
  if (err instanceof ZodError) {
    return NextResponse.json({ error: 'Validation failed', details: formatZodError(err) }, { status: 400 });
  }

  if (err instanceof HttpError) {
    return NextResponse.json({ error: err.message }, { status: err.statusCode });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
    return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
    return NextResponse.json({ error: 'Duplicate generated transaction for this billing date' }, { status: 400 });
  }

  // Foreign-key violation — most commonly a write referencing a userId that has
  // no User row yet (a half-provisioned account). Surface a clear, actionable
  // message instead of a raw 500 so the user can recover by re-authenticating.
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
    return NextResponse.json(
      { error: 'Your account is not fully set up. Please sign out and sign in again.' },
      { status: 409 },
    );
  }

  if (process.env.NODE_ENV !== 'test') {
    console.error(`Unhandled API error on ${request.method} ${requestPath(request)}`, err);
  }

  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
};

export const withApiError = async (request: Request, handler: () => Promise<Response>) => {
  try {
    return await handler();
  } catch (err) {
    return handleApiError(err, request);
  }
};
