'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabaseClient';
import { isDevAuthEnabled } from '@/lib/devAuth';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { AuthHeader } from '@/components/auth/AuthHeader';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';

type Status = 'verifying' | 'success' | 'invalid';

export default function VerifyEmailPage() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>('verifying');

  useEffect(() => {
    if (isDevAuthEnabled()) {
      setStatus('success');
      return;
    }
    const supabase = getSupabaseBrowserClient();
    const run = async () => {
      try {
        const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : '';
        const hashParams = new URLSearchParams(hash);
        const search = new URLSearchParams(window.location.search);

        if (search.get('error_description') || hashParams.get('error_description')) {
          setStatus('invalid');
          return;
        }

        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const code = search.get('code');

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
          if (error) throw error;
        } else if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else {
          const { data } = await supabase.auth.getSession();
          if (!data.session) {
            // No token and no session — treat as a generic "confirmed, please log in".
            setStatus('invalid');
            return;
          }
        }
        window.history.replaceState(null, '', '/verify');
        setStatus('success');
      } catch {
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
