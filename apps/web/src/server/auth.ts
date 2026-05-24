import { User } from '@supabase/supabase-js';
import { HttpError } from './errors';
import { getSupabaseAuthClient } from './supabase';

export type AuthenticatedUser = {
  id: string;
  email?: string;
};

export const extractBearerToken = (authorizationHeader?: string | null) => {
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

export const authenticateRequest = async (request: Request) => {
  const token = extractBearerToken(request.headers.get('authorization'));
  if (!token) throw new HttpError(401, 'Authentication required');

  const devUser = parseDevToken(token);
  if (devUser) return devUser;

  const { data, error } = await getSupabaseAuthClient().auth.getUser(token);
  if (error || !data.user) throw new HttpError(401, 'Invalid or expired session');

  return mapSupabaseUser(data.user);
};

export const getUserId = (user: AuthenticatedUser) => {
  if (!user.id) throw new HttpError(401, 'Authentication required');
  return user.id;
};
