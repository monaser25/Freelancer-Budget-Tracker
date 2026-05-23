'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import {
  AUTH_EMAIL_RATE_LIMIT_COOLDOWN_MS,
  formatAuthWaitTime,
  getAuthEmailCooldownMessage,
  getAuthEmailCooldownSeconds,
  getAuthErrorMessage,
  isAuthEmailRateLimited,
  setAuthEmailCooldown,
} from '@/lib/authEmailRateLimit';
import { isDevAuthEnabled } from '@/lib/devAuth';

const inputClass = 'w-full px-3 py-2 border border-border rounded-md text-[13px] outline-none focus:border-accent bg-background';
const isEmailNotConfirmed = (message: string) => message.toLowerCase().includes('email not confirmed');

export default function RegisterPage() {
  const { signUp, resendConfirmation } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendWaitSeconds, setResendWaitSeconds] = useState(0);

  useEffect(() => {
    if (!confirmationEmail) {
      setResendWaitSeconds(0);
      return;
    }

    const updateCooldown = () => setResendWaitSeconds(getAuthEmailCooldownSeconds(confirmationEmail));
    updateCooldown();
    const intervalId = window.setInterval(updateCooldown, 1000);
    return () => window.clearInterval(intervalId);
  }, [confirmationEmail]);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setConfirmationEmail(null);
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get('email') || '').trim();
    const password = String(formData.get('password') || '');
    const cooldownSeconds = getAuthEmailCooldownSeconds(email);

    if (!isDevAuthEnabled() && cooldownSeconds > 0) {
      setConfirmationEmail(email);
      setError(getAuthEmailCooldownMessage(cooldownSeconds));
      return;
    }

    setIsSubmitting(true);

    try {
      await signUp(email, password);
      setAuthEmailCooldown(email);
      setConfirmationEmail(email);
      setNotice('Check your email to confirm your account before logging in.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create account.';
      if (isAuthEmailRateLimited(message)) {
        setAuthEmailCooldown(email, AUTH_EMAIL_RATE_LIMIT_COOLDOWN_MS);
        setConfirmationEmail(email);
      }
      setError(isEmailNotConfirmed(message)
        ? 'Email not confirmed. Please check your inbox and confirm your account before logging in.'
        : getAuthErrorMessage(message));
      if (isEmailNotConfirmed(message)) setConfirmationEmail(email);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onResendConfirmation = async () => {
    if (!confirmationEmail) return;
    const cooldownSeconds = getAuthEmailCooldownSeconds(confirmationEmail);

    if (cooldownSeconds > 0) {
      setError(getAuthEmailCooldownMessage(cooldownSeconds));
      return;
    }

    setError(null);
    setNotice(null);
    setIsResending(true);

    try {
      await resendConfirmation(confirmationEmail);
      setAuthEmailCooldown(confirmationEmail);
      setNotice(`Confirmation email sent to ${confirmationEmail}.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to resend confirmation email.';
      if (isAuthEmailRateLimited(message)) {
        setAuthEmailCooldown(confirmationEmail, AUTH_EMAIL_RATE_LIMIT_COOLDOWN_MS);
      }
      setError(getAuthErrorMessage(message));
    } finally {
      setIsResending(false);
    }
  };

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-slate-50 p-6">
      <form onSubmit={onSubmit} className="w-full max-w-[420px] bg-card border border-border rounded-[var(--radius-xl)] shadow-sm p-7 space-y-5">
        <div>
          <div className="w-10 h-10 rounded-md bg-accent text-white flex items-center justify-center font-semibold mb-4">FL</div>
          <h1 className="text-[20px] font-semibold text-textPrimary">Create your FlowLedger account</h1>
          <p className="text-[13px] text-textMuted mt-1">Start with a private workspace scoped to your login.</p>
        </div>

        {error && <div className="bg-red-50 border border-red-100 text-red-700 rounded-md px-3 py-2 text-[13px]">{error}</div>}
        {notice && <div className="bg-green-50 border border-green-100 text-green-700 rounded-md px-3 py-2 text-[13px]">{notice}</div>}

        <label className="block">
          <span className="block text-[12px] font-medium text-textSecondary mb-1">Email</span>
          <input name="email" type="email" className={inputClass} required />
        </label>

        <label className="block">
          <span className="block text-[12px] font-medium text-textSecondary mb-1">Password</span>
          <input name="password" type="password" minLength={8} className={inputClass} required />
        </label>

        <button disabled={isSubmitting} className="w-full px-4 py-2 rounded-md bg-accent text-white text-[13px] font-medium hover:bg-accent-hover disabled:opacity-60">
          {isSubmitting ? 'Creating account...' : 'Create Account'}
        </button>

        {confirmationEmail && (
          <button
            type="button"
            onClick={onResendConfirmation}
            disabled={isResending || resendWaitSeconds > 0}
            className="w-full px-4 py-2 rounded-md border border-border text-textSecondary text-[13px] font-medium hover:bg-slate-50 disabled:opacity-60"
          >
            {isResending
              ? 'Sending confirmation...'
              : resendWaitSeconds > 0
                ? `Resend available in ${formatAuthWaitTime(resendWaitSeconds)}`
                : 'Resend confirmation email'}
          </button>
        )}

        <p className="text-center text-[13px] text-textMuted">
          Already have an account? <Link href="/login" className="text-accent font-medium hover:underline">Log in</Link>
        </p>
      </form>
    </main>
  );
}
