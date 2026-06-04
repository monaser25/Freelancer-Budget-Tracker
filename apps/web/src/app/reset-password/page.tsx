'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabaseClient';
import { getAuthErrorMessage } from '@/lib/authEmailRateLimit';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { AuthHeader } from '@/components/auth/AuthHeader';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { Button } from '@/components/ui/Button';
import { Field, StrengthMeter, strength } from '@/components/ui/Form';
import { InlineAlert } from '@/components/ui/InlineAlert';
import { Icon } from '@/components/ui/Icon';

type Status = 'verifying' | 'ready' | 'invalid' | 'done';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>('verifying');
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Establish the recovery session from the URL. The shared client has
  // detectSessionInUrl disabled, so we exchange the token manually here.
  useEffect(() => {
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
          const { error: e } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
          if (e) throw e;
        } else if (code) {
          const { error: e } = await supabase.auth.exchangeCodeForSession(code);
          if (e) throw e;
        } else {
          // Maybe a session already exists (e.g. PASSWORD_RECOVERY event handled).
          const { data } = await supabase.auth.getSession();
          if (!data.session) {
            setStatus('invalid');
            return;
          }
        }
        // Clean the token out of the URL.
        window.history.replaceState(null, '', '/reset-password');
        setStatus('ready');
      } catch {
        setStatus('invalid');
      }
    };
    run();
  }, []);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setIsSubmitting(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error: e } = await supabase.auth.updateUser({ password });
      if (e) throw e;
      await supabase.auth.signOut();
      setStatus('done');
      setTimeout(() => router.replace('/login?reset=1'), 1500);
    } catch (err) {
      setError(getAuthErrorMessage(err instanceof Error ? err.message : 'Failed to update password.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === 'verifying') {
    return (
      <AuthLayout>
        <div className="flex flex-col items-center text-center gap-4 py-10">
          <span className="spinner w-7 h-7 text-accent" />
          <p className="t-body text-text-secondary">Verifying your reset link…</p>
        </div>
      </AuthLayout>
    );
  }

  if (status === 'invalid') {
    return (
      <AuthLayout>
        <div className="w-[56px] h-[56px] rounded-full bg-negative-tint text-negative flex items-center justify-center mb-5">
          <Icon name="alertTriangle" size={26} />
        </div>
        <AuthHeader title="Reset link expired" sub="This password reset link is invalid or has expired. Request a new one to continue." />
        <Button onClick={() => router.push('/forgot-password')} size="lg" className="w-full">
          Request a new link
        </Button>
        <div className="t-body text-text-secondary text-center mt-6">
          <Link href="/login" className="text-accent font-semibold hover:underline">Back to log in</Link>
        </div>
      </AuthLayout>
    );
  }

  if (status === 'done') {
    return (
      <AuthLayout>
        <div className="w-[56px] h-[56px] rounded-full bg-positive-tint text-positive flex items-center justify-center mb-5">
          <Icon name="checkCircle" size={26} />
        </div>
        <AuthHeader title="Password updated" sub="Redirecting you to log in with your new password…" />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <AuthHeader title="Set a new password" sub="Choose a strong password for your Haseeela account." />

      {error && <InlineAlert tone="negative" title="Couldn't update password" body={error} className="mb-[18px]" />}

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Field label="New password" hint="Minimum 8 characters">
          <PasswordInput name="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
          {password && <div className="mt-2"><StrengthMeter value={password} /></div>}
        </Field>
        <Field label="Confirm password" error={confirm && confirm !== password ? 'Passwords do not match' : undefined}>
          <PasswordInput name="confirm" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </Field>
        <Button type="submit" loading={isSubmitting} size="lg" className="w-full mt-1" disabled={strength(password) < 2}>
          {isSubmitting ? 'Updating…' : 'Update password'}
        </Button>
      </form>
    </AuthLayout>
  );
}
