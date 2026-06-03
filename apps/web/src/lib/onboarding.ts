export const ONBOARDED_KEY = 'haseela-onboarded';
export const onboardedFlagKey = (userId: string) => `${ONBOARDED_KEY}:${userId}`;

export const hasOnboarded = (userId: string) => {
  if (typeof window === 'undefined') return true;
  try {
    return window.localStorage.getItem(onboardedFlagKey(userId)) === '1';
  } catch {
    return true;
  }
};

export const markOnboarded = (userId: string) => {
  try {
    window.localStorage.setItem(onboardedFlagKey(userId), '1');
  } catch {
    /* ignore */
  }
};
