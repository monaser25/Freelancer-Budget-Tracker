import { NextFunction, Request, Response } from 'express';
import { User } from '@supabase/supabase-js';
import { getSupabaseAuthClient } from './supabase';
import { HttpError } from './errors';

export type AuthenticatedUser = {
  id: string;
  email?: string;
};

export type AuthenticatedRequest = Request & {
  user?: AuthenticatedUser;
};

export const extractBearerToken = (authorizationHeader?: string) => {
  if (!authorizationHeader) return null;

  const [scheme, token] = authorizationHeader.split(' ');
  if (scheme !== 'Bearer' || !token) return null;

  return token;
};

const DEV_TOKEN_PREFIX = 'flowledger-dev:';

const isDevAuthEnabled = () => (
  process.env.NODE_ENV !== 'production' && process.env.ENABLE_DEV_AUTH === 'true'
);

const parseDevToken = (token: string): AuthenticatedUser | null => {
  if (!isDevAuthEnabled() || !token.startsWith(DEV_TOKEN_PREFIX)) return null;

  try {
    const parsed = JSON.parse(decodeURIComponent(token.slice(DEV_TOKEN_PREFIX.length))) as AuthenticatedUser;
    if (!parsed.id || typeof parsed.id !== 'string') return null;
    return {
      id: parsed.id,
      email: typeof parsed.email === 'string' ? parsed.email : undefined,
    };
  } catch {
    return null;
  }
};

export const mapSupabaseUser = (user: User): AuthenticatedUser => ({
  id: user.id,
  email: user.email ?? undefined,
});

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = extractBearerToken(req.headers.authorization);
    if (!token) throw new HttpError(401, 'Authentication required');

    const devUser = parseDevToken(token);
    if (devUser) {
      (req as AuthenticatedRequest).user = devUser;
      next();
      return;
    }

    const { data, error } = await getSupabaseAuthClient().auth.getUser(token);
    if (error || !data.user) throw new HttpError(401, 'Invalid or expired session');

    (req as AuthenticatedRequest).user = mapSupabaseUser(data.user);
    next();
  } catch (err) {
    next(err);
  }
};

export const getAuthUser = (req: Request) => {
  const user = (req as AuthenticatedRequest).user;
  if (!user?.id) throw new HttpError(401, 'Authentication required');
  return user;
};

export const getUserId = (req: Request) => getAuthUser(req).id;
