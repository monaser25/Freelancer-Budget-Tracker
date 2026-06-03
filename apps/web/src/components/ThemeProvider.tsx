'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';

export const THEME_STORAGE_KEY = 'haseela-theme';

type ThemeContextValue = {
  /** The user's chosen preference: light, dark, or system. */
  theme: ThemeMode;
  /** The theme actually applied right now (system resolved to light/dark). */
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: ThemeMode) => void;
  /** Quick flip between light and dark (used by the topbar button). */
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const prefersDark = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;

const resolve = (mode: ThemeMode): 'light' | 'dark' =>
  mode === 'system' ? (prefersDark() ? 'dark' : 'light') : mode;

const applyTheme = (resolved: 'light' | 'dark') => {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', resolved === 'dark');
  document.documentElement.style.colorScheme = resolved;
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Default to dark — the brief & prototype are "dark mode first".
  const [theme, setThemeState] = useState<ThemeMode>('dark');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark');

  // Hydrate from storage on mount (the inline head script already set the
  // class to avoid a flash; this syncs React state to it).
  useEffect(() => {
    let stored: ThemeMode = 'dark';
    try {
      const raw = window.localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
      if (raw === 'light' || raw === 'dark' || raw === 'system') stored = raw;
    } catch {
      /* ignore */
    }
    setThemeState(stored);
    const r = resolve(stored);
    setResolvedTheme(r);
    applyTheme(r);
  }, []);

  // React to OS changes while in "system" mode.
  useEffect(() => {
    if (theme !== 'system' || typeof window === 'undefined') return;
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      const r = prefersDark() ? 'dark' : 'light';
      setResolvedTheme(r);
      applyTheme(r);
    };
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [theme]);

  const setTheme = useCallback((next: ThemeMode) => {
    setThemeState(next);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
    const r = resolve(next);
    setResolvedTheme(r);
    applyTheme(r);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  }, [resolvedTheme, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};

/**
 * Inline script string injected into <head> to set the theme class before the
 * first paint, preventing a light→dark flash. Defaults to dark.
 */
export const themeNoFlashScript = `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}')||'dark';var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);document.documentElement.style.colorScheme=d?'dark':'light';}catch(e){document.documentElement.classList.add('dark');}})();`;
