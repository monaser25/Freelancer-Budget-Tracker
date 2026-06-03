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
import { AuthLayout } from '@/components/layout/AuthLayout';
import { AuthHeader } from '@/components/auth/AuthHeader';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { Button } from '@/components/ui/Button';
import { Field, Input, StrengthMeter } from '@/components/ui/Form';
import { InlineAlert } from '@/components/ui/InlineAlert';
import { Icon } from '@/components/ui/Icon';

const isEmailNotConfirmed = (message: string) => message.toLowerCase().includes('email not confirmed');

export default function RegisterPage() {
  const { signUp, resendConfirmation } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendWaitSeconds, setResendWaitSeconds] = useState(0);
  const [password, setPassword] = useState('');

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
    const name = String(formData.get('name') || '').trim();
    const email = String(formData.get('email') || '').trim();
    const submittedPassword = String(formData.get('password') || password);
    const cooldownSeconds = getAuthEmailCooldownSeconds(email);

    if (!isDevAuthEnabled() && cooldownSeconds > 0) {
      setConfirmationEmail(email);
      setError(getAuthEmailCooldownMessage(cooldownSeconds));
      return;
    }

    setIsSubmitting(true);

    try {
      await signUp(email, submittedPassword, name);
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

  if (notice && !error) {
    return (
      <AuthLayout>
        <div className="w-[56px] h-[56px] rounded-full bg-positive-tint text-positive flex items-center justify-center mb-5">
          <Icon name="mail" size={26} />
        </div>
        <AuthHeader 
          title="Check your email" 
          sub="We sent a confirmation link to your email. Click it to activate your account." 
        />
        <Button 
          variant="secondary" 
          disabled={isResending || resendWaitSeconds > 0} 
          onClick={onResendConfirmation} 
          className="w-full mt-4" 
          icon="refreshCcw"
        >
          {isResending
            ? 'Sending...'
            : resendWaitSeconds > 0
              ? `Resend in ${formatAuthWaitTime(resendWaitSeconds)}`
              : 'Resend confirmation email'}
        </Button>
        <div className="t-body text-text-secondary text-center mt-6">
          <Link href="/login" className="text-accent font-semibold hover:underline">Return to log in</Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <AuthHeader title="Create your account" sub="Start tracking your freelance finances in minutes." />
      
      {error && (
        <InlineAlert 
          tone={confirmationEmail && error.includes('confirm') ? "warning" : "negative"} 
          title={confirmationEmail && error.includes('confirm') ? "Confirm your email first" : "Registration error"} 
          body={error}
          className="mb-[18px]"
        >
          {confirmationEmail && (
            <button
              type="button"
              onClick={onResendConfirmation}
              disabled={isResending || resendWaitSeconds > 0}
              className={`t-small font-semibold mt-2 ${resendWaitSeconds > 0 ? 'text-text-muted cursor-default' : 'text-accent hover:underline cursor-pointer'}`}
            >
              {isResending
                ? 'Sending...'
                : resendWaitSeconds > 0
                  ? `Resend in ${formatAuthWaitTime(resendWaitSeconds)}`
                  : 'Resend confirmation email'}
            </button>
          )}
        </InlineAlert>
      )}

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Field label="Name">
          <Input name="name" type="text" placeholder="Your name" required autoFocus />
        </Field>

        <Field label="Email">
          <Input name="email" type="email" placeholder="you@email.com" required />
        </Field>

        <Field label="Password" hint="Minimum 8 characters">
          <PasswordInput 
            name="password" 
            required 
            minLength={8} 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {password && <div className="mt-2"><StrengthMeter value={password} /></div>}
        </Field>

        <Button type="submit" loading={isSubmitting} size="lg" className="w-full mt-1">
          {isSubmitting ? 'Creating account...' : 'Create account'}
        </Button>
      </form>

      <div className="t-body text-text-secondary text-center mt-6">
        Already have an account? <Link href="/login" className="text-accent font-semibold hover:underline">Log in</Link>
      </div>
    </AuthLayout>
  );
}
