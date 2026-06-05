'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { clearDevAuthUser, getDevAuthUser, isDevAuthEnabled, setDevAuthUser } from '@/lib/devAuth';
import { getSupabaseBrowserClient } from '@/lib/supabaseClient';
import { logAuth, logAuthStateChange, describeSession } from '@/lib/authDebug';
import { useFinancialStore } from '@/store/financialStore';
import { useInvoiceStore } from '@/store/invoiceStore';
import { useNotificationStore } from '@/store/notificationStore';

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<{ requiresEmailConfirmation: boolean }>;
  resendConfirmation: (email: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const resetWorkspaceStores = () => {
  useFinancialStore.getState().resetStore();
  useInvoiceStore.getState().reset();
  useNotificationStore.getState().reset();
};

const resetWorkspaceStoresForUserChange = (nextUserId?: string) => {
  const currentStorageUserId = useFinancialStore.getState().storageUserId;
  if (currentStorageUserId && nextUserId && currentStorageUserId !== nextUserId) {
    resetWorkspaceStores();
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isDevAuthEnabled()) {
      const user = getDevAuthUser();
      setSession(user ? ({ user } as Session) : null);
      setIsLoading(false);
      return;
    }

    const supabase = getSupabaseBrowserClient();

    supabase.auth.getSession()
      .then(({ data, error }) => {
        if (error) throw error;
        logAuth('provider:initial-session', { session: describeSession(data.session) });
        setSession(data.session);
      })
      .catch(() => setSession(null))
      .finally(() => setIsLoading(false));

    const { data: listener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      logAuthStateChange(event, nextSession);
      const nextUserId = nextSession?.user.id;

      resetWorkspaceStoresForUserChange(nextUserId);

      if (event === 'SIGNED_OUT') {
        resetWorkspaceStores();
      }

      // A PASSWORD_RECOVERY event means a recovery token was detected on the
      // shared client. The reset flow uses an isolated client, so this should
      // not normally fire — but if it ever does, refuse to treat it as a login.
      if (event === 'PASSWORD_RECOVERY') {
        logAuth('provider:password-recovery-ignored');
        return;
      }

      setSession(nextSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    if (isDevAuthEnabled()) {
      return {
        session,
        user: session?.user ?? null,
        isLoading,
        signIn: async (email) => {
          const user = setDevAuthUser(email);
          resetWorkspaceStoresForUserChange(user.id);
          setSession({ user } as Session);
        },
        signUp: async (email) => {
          const user = setDevAuthUser(email);
          resetWorkspaceStoresForUserChange(user.id);
          setSession({ user } as Session);
          return { requiresEmailConfirmation: false };
        },
        resendConfirmation: async () => undefined,
        requestPasswordReset: async () => undefined,
        updatePassword: async () => undefined,
        signOut: async () => {
          clearDevAuthUser();
          setSession(null);
          resetWorkspaceStores();
        },
      };
    }

    const supabase = getSupabaseBrowserClient();
    const origin = () => (typeof window === 'undefined' ? '' : window.location.origin);
    const emailRedirectTo = () => `${origin()}/verify`;

    return {
      session,
      user: session?.user ?? null,
      isLoading,
      signIn: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      },
      signUp: async (email, password, name) => {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: emailRedirectTo(),
            data: name ? { name } : undefined,
          },
        });
        if (error) throw error;

        if (data.session) {
          await supabase.auth.signOut();
          setSession(null);
        }

        return { requiresEmailConfirmation: true };
      },
      resendConfirmation: async (email) => {
        const { error } = await supabase.auth.resend({
          type: 'signup',
          email,
          options: { emailRedirectTo: emailRedirectTo() },
        });
        if (error) throw error;
      },
      requestPasswordReset: async (email) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${origin()}/reset-password`,
        });
        if (error) throw error;
      },
      updatePassword: async (password) => {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
      },
      signOut: async () => {
        // Always end up logged out locally, even if the server-side revoke
        // fails. A stale token (e.g. it references a Supabase user that was
        // deleted) makes the global signOut 403 — without the local fallback
        // the user would be stuck unable to clear the bad session.
        try {
          const { error } = await supabase.auth.signOut();
          if (error) await supabase.auth.signOut({ scope: 'local' });
        } catch {
          await supabase.auth.signOut({ scope: 'local' }).catch(() => undefined);
        } finally {
          resetWorkspaceStores();
        }
      },
    };
  }, [isLoading, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
