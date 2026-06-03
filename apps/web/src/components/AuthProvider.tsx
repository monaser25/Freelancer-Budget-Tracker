'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { clearDevAuthUser, getDevAuthUser, isDevAuthEnabled, setDevAuthUser } from '@/lib/devAuth';
import { getSupabaseBrowserClient } from '@/lib/supabaseClient';
import { useFinancialStore } from '@/store/financialStore';

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
        setSession(data.session);
      })
      .catch(() => setSession(null))
      .finally(() => setIsLoading(false));

    const { data: listener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      const currentStorageUserId = useFinancialStore.getState().storageUserId;
      const nextUserId = nextSession?.user.id;

      if (currentStorageUserId && nextUserId && currentStorageUserId !== nextUserId) {
        useFinancialStore.getState().resetStore();
      }

      if (event === 'SIGNED_OUT') {
        useFinancialStore.getState().resetStore();
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
          setSession({ user } as Session);
        },
        signUp: async (email) => {
          const user = setDevAuthUser(email);
          setSession({ user } as Session);
          return { requiresEmailConfirmation: false };
        },
        resendConfirmation: async () => undefined,
        requestPasswordReset: async () => undefined,
        updatePassword: async () => undefined,
        signOut: async () => {
          clearDevAuthUser();
          setSession(null);
          useFinancialStore.getState().resetStore();
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
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        useFinancialStore.getState().resetStore();
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
