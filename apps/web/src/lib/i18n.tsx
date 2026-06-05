'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { t as translate, type MessageKey, type MessageVars } from '../messages';
import { DEFAULT_LOCALE, dirFor, type Locale, type LocaleDir } from './locales';

type LocaleContextValue = {
  locale: Locale;
  dir: LocaleDir;
  t: (key: MessageKey, vars?: MessageVars) => string;
  setLocale: (locale: Locale) => void;
};

type LocaleProviderProps = {
  children: ReactNode;
  initialLocale?: Locale;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children, initialLocale = DEFAULT_LOCALE }: LocaleProviderProps) {
  const [locale, setLocale] = useState<Locale>(initialLocale);

  const t = useCallback(
    (key: MessageKey, vars?: MessageVars) => translate(locale, key, vars),
    [locale],
  );

  const value = useMemo(
    () => ({
      locale,
      dir: dirFor(locale),
      t,
      setLocale,
    }),
    [locale, t],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export const useLocale = () => {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider');
  return ctx;
};
