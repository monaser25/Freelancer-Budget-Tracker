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
