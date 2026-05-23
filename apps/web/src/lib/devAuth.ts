import type { User } from '@supabase/supabase-js';

const STORAGE_KEY = 'flowledger-dev-auth-user';
const TOKEN_PREFIX = 'flowledger-dev:';

type DevAuthUser = {
  id: string;
  email: string;
};

export const isDevAuthEnabled = () => (
  process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_AUTH_MODE === 'dev'
);

const makeUserId = (email: string) => {
  const safeEmail = email.toLowerCase().replace(/[^a-z0-9._-]/g, '-');
  return `dev-${safeEmail}`;
};

export const createDevAuthUser = (email: string): User => ({
  id: makeUserId(email),
  email,
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
} as User);

export const getDevAuthUser = () => {
  if (typeof window === 'undefined') return null;

  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value ? JSON.parse(value) as User : null;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
};

export const setDevAuthUser = (email: string) => {
  const user = createDevAuthUser(email);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ id: user.id, email: user.email }));
  return user;
};

export const clearDevAuthUser = () => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
};

export const getDevAuthHeaders = () => {
  const user = getDevAuthUser();
  if (!user?.id) return null;

  const payload: DevAuthUser = { id: user.id, email: user.email || `${user.id}@flowledger.local` };
  return { Authorization: `Bearer ${TOKEN_PREFIX}${encodeURIComponent(JSON.stringify(payload))}` };
};
