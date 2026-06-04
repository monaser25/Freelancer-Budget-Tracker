import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js';

/**
 * Lightweight, structured auth logging so we can verify exactly which
 * user/email is active at each step of every auth flow (login, signup,
 * email confirmation, password reset, callback handling).
 *
 * Logs are always emitted in development; in production they can be enabled
 * with NEXT_PUBLIC_AUTH_DEBUG=true to debug live incidents without a redeploy.
 */
const isEnabled = () =>
  process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_AUTH_DEBUG === 'true';

type AuthLogDetails = Record<string, unknown>;

export const logAuth = (step: string, details: AuthLogDetails = {}) => {
  if (!isEnabled()) return;
  // eslint-disable-next-line no-console
  console.info(`[auth] ${step}`, { ts: new Date().toISOString(), ...details });
};

export const describeUser = (user?: User | null) =>
  user ? { userId: user.id, email: user.email ?? null } : null;

export const describeSession = (session?: Session | null) =>
  session ? { userId: session.user.id, email: session.user.email ?? null } : null;

export const logAuthStateChange = (event: AuthChangeEvent, session: Session | null) =>
  logAuth(`onAuthStateChange:${event}`, { session: describeSession(session) });
