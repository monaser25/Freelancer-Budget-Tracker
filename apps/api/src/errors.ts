import { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';

type AsyncRoute = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

export const asyncHandler = (handler: AsyncRoute) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
};

const formatZodError = (error: ZodError) => {
  return error.issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
  }));
};

export const errorHandler = (err: unknown, req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ZodError) {
    res.status(400).json({ error: 'Validation failed', details: formatZodError(err) });
    return;
  }

  if (err instanceof HttpError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
    res.status(404).json({ error: 'Resource not found' });
    return;
  }

  if (process.env.NODE_ENV !== 'test') {
    console.error(`Unhandled API error on ${req.method} ${req.path}`, err);
  }

  res.status(500).json({ error: 'Internal server error' });
};
