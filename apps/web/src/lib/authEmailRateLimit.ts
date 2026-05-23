const STORAGE_PREFIX = 'flowledger-auth-email-cooldown';

export const AUTH_EMAIL_RESEND_COOLDOWN_MS = 60 * 1000;
export const AUTH_EMAIL_RATE_LIMIT_COOLDOWN_MS = 60 * 60 * 1000;

const getStorageKey = (email: string) => `${STORAGE_PREFIX}:${email.toLowerCase()}`;

export const isAuthEmailRateLimited = (message: string) => {
  const normalized = message.toLowerCase();
  return normalized.includes('email rate limit') || normalized.includes('rate limit exceeded');
};

export const setAuthEmailCooldown = (email: string, durationMs = AUTH_EMAIL_RESEND_COOLDOWN_MS) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(getStorageKey(email), String(Date.now() + durationMs));
};

export const getAuthEmailCooldownSeconds = (email: string) => {
  if (typeof window === 'undefined') return 0;

  const expiresAt = Number(window.localStorage.getItem(getStorageKey(email)) || 0);
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
    window.localStorage.removeItem(getStorageKey(email));
    return 0;
  }

  return Math.ceil((expiresAt - Date.now()) / 1000);
};

export const formatAuthWaitTime = (seconds: number) => {
  if (seconds >= 60) return `${Math.ceil(seconds / 60)} min`;
  return `${seconds}s`;
};

export const getAuthEmailCooldownMessage = (seconds: number) => (
  `A confirmation email was requested recently. Try again in ${formatAuthWaitTime(seconds)}.`
);

export const getAuthErrorMessage = (message: string) => (
  isAuthEmailRateLimited(message)
    ? 'Supabase email rate limit was exceeded. Wait before trying again, or configure custom SMTP in Supabase Auth for higher email limits.'
    : message
);
