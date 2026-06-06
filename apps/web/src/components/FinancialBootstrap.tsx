'use client';

import { useEffect } from 'react';
import { loadFinancialSnapshot } from '@/services/financialApi';
import { useFinancialStore } from '@/store/financialStore';
import { useNotificationStore } from '@/store/notificationStore';
import { useAuth } from '@/components/AuthProvider';
import { useLocale } from '@/lib/i18n';

const getStorageKey = (userId: string) => `flowledger-financial-state:${userId}`;

export function FinancialBootstrap() {
  const { user } = useAuth();
  const userId = user?.id;
  const { setInitialData, setError, setStorageUserId } = useFinancialStore();
  const { t } = useLocale();

  useEffect(() => {
    if (!userId) return;

    const state = useFinancialStore.getState();
    if (state.isInitialized && state.storageUserId === userId) return;

    let cancelled = false;

    setStorageUserId(userId);

    // Load notifications after the first paint so page transitions are not held
    // behind reminder generation.
    const notificationTimer = window.setTimeout(() => {
      if (!useNotificationStore.getState().isLoaded) {
        void useNotificationStore.getState().load();
      }
    }, 250);

    const loadCachedSnapshot = () => {
      const cached = window.localStorage.getItem(getStorageKey(userId));
      if (!cached) return false;

      try {
        const data = JSON.parse(cached);
        setInitialData({
          clients: data.clients || [],
          subscriptions: data.subscriptions || [],
          transactions: data.transactions || [],
        });
        return true;
      } catch (err) {
        console.warn('Failed to read local financial cache.', err);
        return false;
      }
    };

    const hasCachedSnapshot = loadCachedSnapshot();

    loadFinancialSnapshot()
      .then((data) => {
        if (cancelled) return;
        setError(null);
        setInitialData({
          clients: data.clients || [],
          subscriptions: data.subscriptions || [],
          transactions: data.transactions || [],
        });
      })
      .catch((err) => {
        if (cancelled) return;
        console.warn('Backend unavailable.', err);
        if (hasCachedSnapshot) {
          setError(err instanceof Error ? `${t('errors.cachedData')} (${err.message})` : t('errors.cachedData'));
          return;
        }

        setError(err instanceof Error ? `${t('errors.dataUnavailable')} (${err.message})` : t('errors.dataUnavailable'));
        setInitialData({
          clients: [],
          subscriptions: [],
          transactions: [],
        });
      });

    return () => {
      cancelled = true;
      window.clearTimeout(notificationTimer);
    };
  }, [setError, setInitialData, setStorageUserId, userId]);

  return null;
}
