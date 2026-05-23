import { useMemo } from 'react';
import { useFinancialStore as useStore } from './financialStore';
import { OverviewStats } from '@/types/finance';
import { getOverviewStats } from '@/selectors/financialSelectors';

export const useFinancialStore = () => {
  const store = useStore();

  const overview = useMemo<OverviewStats>(() => {
    return getOverviewStats(store.transactions, store.clients, store.subscriptions);
  }, [store.transactions, store.clients, store.subscriptions]);

  return {
    ...store,
    overview,
  };
};
