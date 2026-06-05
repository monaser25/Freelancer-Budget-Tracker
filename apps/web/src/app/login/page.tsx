'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { useLocale } from '@/lib/i18n';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { AuthHeader } from '@/components/auth/AuthHeader';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Form';
import { InlineAlert } from '@/components/ui/InlineAlert';

const isEmailNotConfirmed = (message: string) => message.toLowerCase().includes('email not confirmed');

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLocale();
  const { signIn, resendConfirmation } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendWaitSeconds, setResendWaitSeconds] = useState(0);

  useEffect(() => {
    if (searchParams.get('confirmed') === '1') {
      setNotice(t('auth.login.notice.email_confirmed'));
      window.history.replaceState(null, '', '/login');
      return;
    }
    if (searchParams.get('reset') === '1') {
      setNotice(t('auth.login.notice.password_updated'));
      window.history.replaceState(null, '', '/login');
      return;
    }
    if (searchParams.get('expired') === '1') {
      setNotice(t('auth.login.notice.session_expired'));
      window.history.replaceState(null, '', '/login');
    }
  }, [searchParams, t]);

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
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get('email') || '').trim();
    const password = String(formData.get('password') || '');

    try {
      await signIn(email, password);
      router.replace(searchParams.get('redirect') || '/');
    } catch (err) {
      const message = err instanceof Error ? err.message : t('auth.login.error.default');
      if (isAuthEmailRateLimited(message)) {
        setAuthEmailCooldown(email, AUTH_EMAIL_RATE_LIMIT_COOLDOWN_MS);
        setConfirmationEmail(email);
      }
      setError(isEmailNotConfirmed(message)
        ? t('auth.login.error.email_not_confirmed')
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
      setNotice(t('auth.login.notice.resend_success', { email: confirmationEmail }));
    } catch (err) {
      const message = err instanceof Error ? err.message : t('auth.login.error.resend_failed');
      if (isAuthEmailRateLimited(message)) {
        setAuthEmailCooldown(confirmationEmail, AUTH_EMAIL_RATE_LIMIT_COOLDOWN_MS);
      }
      setError(getAuthErrorMessage(message));
    } finally {
      setIsResending(false);
    }
  };

  return (
    <AuthLayout>
      <AuthHeader title={t('auth.login.title')} sub={t('auth.login.subtitle')} />
      
      {error && (
        <InlineAlert 
          tone={confirmationEmail && error.includes('confirm') ? "warning" : "negative"} 
          title={confirmationEmail && error.includes('confirm') ? t('auth.login.alert.confirm_title') : t('auth.login.alert.error_title')} 
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
                ? t('auth.login.action.sending')
                : resendWaitSeconds > 0
                  ? t('auth.login.action.resend_in', { time: formatAuthWaitTime(resendWaitSeconds) })
                  : t('auth.login.action.resend')}
            </button>
          )}
        </InlineAlert>
      )}
      
      {notice && (
        <InlineAlert 
          tone="positive" 
          title={t('auth.login.alert.notice_title')} 
          body={notice}
          className="mb-[18px]"
        />
      )}

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Field label={t('auth.login.label.email')}>
          <Input name="email" type="email" placeholder={t('auth.login.placeholder.email')} required autoFocus />
        </Field>

        <Field
          label={
            <span className="flex items-center justify-between">
              <span>{t('auth.login.label.password')}</span>
              <Link href="/forgot-password" className="t-small font-medium text-accent hover:underline">
                {t('auth.login.action.forgot_password')}
              </Link>
            </span>
          }
        >
          <PasswordInput name="password" required />
        </Field>

        <Button type="submit" loading={isSubmitting} size="lg" className="w-full mt-1">
          {isSubmitting ? t('auth.login.action.logging_in') : t('auth.login.action.login')}
        </Button>
      </form>

      <div className="t-body text-text-secondary text-center mt-6">
        {t('auth.login.text.new_to')} <Link href="/register" className="text-accent font-semibold hover:underline">{t('auth.login.action.create_account')}</Link>
      </div>
    </AuthLayout>
  );
}
