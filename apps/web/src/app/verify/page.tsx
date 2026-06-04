'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabaseClient';
import { isDevAuthEnabled } from '@/lib/devAuth';
import { logAuth, describeUser } from '@/lib/authDebug';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { AuthHeader } from '@/components/auth/AuthHeader';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';

type Status = 'verifying' | 'success' | 'invalid';

export default function VerifyEmailPage() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>('verifying');
  // Guard against React StrictMode double-invoking the effect, which would
  // otherwise consume the single-use confirmation token twice and fail.
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    if (isDevAuthEnabled()) {
      setStatus('success');
      return;
    }
    const supabase = getSupabaseBrowserClient();
    const run = async () => {
      logAuth('verify:start', { href: window.location.href.split('#')[0] });
      try {
        const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : '';
        const hashParams = new URLSearchParams(hash);
        const search = new URLSearchParams(window.location.search);

        if (search.get('error_description') || hashParams.get('error_description')) {
          logAuth('verify:invalid', { reason: 'error_description in url' });
          setStatus('invalid');
          return;
        }

        const type = hashParams.get('type') || search.get('type');

        // Defense in depth: a recovery (password reset) token must NEVER be
        // turned into a logged-in session on this page. If a misconfigured
        // Supabase redirect sends one here, forward it to the reset flow
        // (carrying the token) instead of signing the user in.
        if (type === 'recovery') {
          logAuth('verify:forward-recovery-to-reset');
          window.location.replace(
            `/reset-password${window.location.search}${window.location.hash}`,
          );
          return;
        }

        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const tokenHash = search.get('token_hash') || hashParams.get('token_hash');
        const code = search.get('code');

        if (tokenHash) {
          const otpType = (type as 'signup' | 'email' | 'magiclink' | null) ?? 'signup';
          const { error } = await supabase.auth.verifyOtp({ type: otpType, token_hash: tokenHash });
          if (error) throw error;
        } else if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
          if (error) throw error;
        } else if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else {
          // No confirmation token present. Do NOT fall back to a pre-existing
          // session — that could silently "confirm" off an unrelated stale
          // session. Treat as an expired/used link.
          logAuth('verify:invalid', { reason: 'no confirmation token in url' });
          setStatus('invalid');
          return;
        }

        const { data: userData } = await supabase.auth.getUser();
        logAuth('verify:confirmed', { user: describeUser(userData.user) });

        window.history.replaceState(null, '', '/verify');
        setStatus('success');
      } catch (err) {
        logAuth('verify:invalid', { reason: 'token exchange failed', message: err instanceof Error ? err.message : String(err) });
        setStatus('invalid');
      }
    };
    run();
  }, []);

  if (status === 'verifying') {
    return (
      <AuthLayout>
        <div className="flex flex-col items-center text-center gap-4 py-10">
          <span className="spinner w-7 h-7 text-accent" />
          <p className="t-body text-text-secondary">Confirming your email…</p>
        </div>
      </AuthLayout>
    );
  }

  if (status === 'success') {
    return (
      <AuthLayout>
        <div className="w-[56px] h-[56px] rounded-full bg-positive-tint text-positive flex items-center justify-center mb-5">
          <Icon name="checkCircle" size={26} />
        </div>
        <AuthHeader title="Email confirmed" sub="Your account is ready. Let's set up your workspace." />
        <Button onClick={() => router.replace('/onboarding')} size="lg" className="w-full">
          Continue to Haseeela
        </Button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="w-[56px] h-[56px] rounded-full bg-warning-tint text-warning flex items-center justify-center mb-5">
        <Icon name="alertTriangle" size={26} />
      </div>
      <AuthHeader
        title="Confirmation link expired"
        sub="This link is invalid or has already been used. Try logging in — if your email isn't confirmed yet, you can resend the link from there."
      />
      <Button onClick={() => router.push('/login')} size="lg" className="w-full">
        Go to log in
      </Button>
      <div className="t-body text-text-secondary text-center mt-6">
        Need a new account? <Link href="/register" className="text-accent font-semibold hover:underline">Sign up</Link>
      </div>
    </AuthLayout>
  );
}
