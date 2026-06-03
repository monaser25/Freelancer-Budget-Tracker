'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { loadFinancialSnapshot } from '@/services/financialApi';
import { useFinancialStore } from '@/store/financialStore';
import { useNotificationStore } from '@/store/notificationStore';
import { useAuth } from '@/components/AuthProvider';

const getStorageKey = (userId: string) => `flowledger-financial-state:${userId}`;

export function FinancialBootstrap() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { isInitialized, setInitialData, setError, setStorageUserId, processPendingBillings } = useFinancialStore();

  useEffect(() => {
    if (isInitialized || !user) return;

    setStorageUserId(user.id);

    // Load notifications (and generate reminders) once per session.
    if (!useNotificationStore.getState().isLoaded) {
      useNotificationStore.getState().load();
    }

    const loadCachedSnapshot = () => {
      const cached = window.localStorage.getItem(getStorageKey(user.id));
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

    loadFinancialSnapshot()
      .then((data) => {
        setError(null);
        setInitialData({
          clients: data.clients || [],
          subscriptions: data.subscriptions || [],
          transactions: data.transactions || [],
        });
      })
      .catch((err) => {
        console.warn('Backend unavailable.', err);
        if (loadCachedSnapshot()) {
          setError('Using locally cached data. API sync will resume when the backend is available.');
          return;
        }

        setError('Financial data is unavailable. Check the API connection and try again.');
        setInitialData({
          clients: [],
          subscriptions: [],
          transactions: [],
        });
      });
  }, [isInitialized, setError, setInitialData, setStorageUserId, user]);

  useEffect(() => {
    if (!isInitialized) return;
    processPendingBillings();
  }, [isInitialized, pathname, processPendingBillings]);

  return null;
}
