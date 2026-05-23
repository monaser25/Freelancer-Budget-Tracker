'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { mockClients, mockSubscriptions, mockTransactions } from '@/lib/mockData';
import { loadFinancialSnapshot } from '@/services/financialApi';
import { useFinancialStore } from '@/store/financialStore';
import { useAuth } from '@/components/AuthProvider';

const getStorageKey = (userId: string) => `flowledger-financial-state:${userId}`;

export function FinancialBootstrap() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { isInitialized, setInitialData, setError, setStorageUserId, processPendingBillings } = useFinancialStore();

  useEffect(() => {
    if (isInitialized || !user) return;

    setStorageUserId(user.id);

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
        console.warn('Backend unavailable, falling back to local data.', err);
        if (loadCachedSnapshot()) {
          setError('Using locally cached data. API sync will resume when the backend is available.');
          return;
        }

        setError('Using mock data. Connect the API to persist changes across devices.');
        setInitialData({
          clients: mockClients,
          subscriptions: mockSubscriptions,
          transactions: mockTransactions,
        });
      });
  }, [isInitialized, setError, setInitialData, setStorageUserId, user]);

  useEffect(() => {
    if (!isInitialized) return;
    processPendingBillings();
  }, [isInitialized, pathname, processPendingBillings]);

  return null;
}
