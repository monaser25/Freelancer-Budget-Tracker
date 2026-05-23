import { create } from 'zustand';
import { Client, Subscription, Transaction } from '@/types/finance';
import {
  createClientAPI,
  updateClientAPI,
  deleteClientAPI,
  createSubscriptionAPI,
  updateSubscriptionAPI,
  deleteSubscriptionAPI,
  createTransactionAPI,
  updateTransactionAPI,
  deleteTransactionAPI,
  loadFinancialSnapshot
} from '@/services/financialApi';

const STORAGE_KEY = 'flowledger-financial-state';

const getStorageKey = () => {
  const userId = useFinancialStore.getState().storageUserId;
  return userId ? `${STORAGE_KEY}:${userId}` : STORAGE_KEY;
};

export const computeNextBillingDate = (billingDay: number, from = new Date()) => {
  const safeDay = Math.max(1, Math.min(28, billingDay || 1));
  const candidate = new Date(from.getFullYear(), from.getMonth(), safeDay, 12);
  const today = new Date(from.getFullYear(), from.getMonth(), from.getDate(), 12);

  if (candidate >= today) return candidate.toISOString().slice(0, 10);
  return new Date(from.getFullYear(), from.getMonth() + 1, safeDay, 12).toISOString().slice(0, 10);
};

interface FinancialStore {
  clients: Client[];
  subscriptions: Subscription[];
  transactions: Transaction[];
  isInitialized: boolean;
  storageUserId: string | null;
  error: string | null;

  setInitialData: (data: { clients: Client[]; subscriptions: Subscription[]; transactions: Transaction[] }) => void;
  initializeStore: (data: { clients: Client[]; subscriptions: Subscription[]; transactions: Transaction[] }) => void;
  setStorageUserId: (userId: string) => void;
  resetStore: () => void;
  processPendingBillings: () => void;
  setError: (error: string | null) => void;

  addClient: (client: Client) => Promise<void>;
  updateClient: (id: string, updates: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;

  addSubscription: (subscription: Subscription) => Promise<void>;
  updateSubscription: (id: string, updates: Partial<Subscription>) => Promise<void>;
  deleteSubscription: (id: string) => Promise<void>;

  addTransaction: (transaction: Transaction) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  setTransactions: (transactions: Transaction[]) => void;
}

const persistLocalSnapshot = () => {
  if (typeof window === 'undefined') return;

  const { clients, subscriptions, transactions } = useFinancialStore.getState();
  window.localStorage.setItem(getStorageKey(), JSON.stringify({ clients, subscriptions, transactions }));
};

const refreshDataFromAPI = async () => {
  try {
    const data = await loadFinancialSnapshot();
    useFinancialStore.getState().setInitialData(data);
    useFinancialStore.getState().setError(null);
  } catch (err) {
    useFinancialStore.getState().setError('Failed to refresh data from server');
  }
};

export const useFinancialStore = create<FinancialStore>((set) => ({
  clients: [],
  subscriptions: [],
  transactions: [],
  isInitialized: false,
  storageUserId: null,
  error: null,

  setInitialData: (data) => {
    set({
      clients: data.clients,
      subscriptions: data.subscriptions,
      transactions: data.transactions,
      isInitialized: true,
    });
    persistLocalSnapshot();
  },
  initializeStore: (data) => {
    useFinancialStore.getState().setInitialData(data);
  },
  setStorageUserId: (userId) => set({ storageUserId: userId }),
  resetStore: () => set({
    clients: [],
    subscriptions: [],
    transactions: [],
    isInitialized: false,
    storageUserId: null,
    error: null,
  }),
  setError: (error) => set({ error }),

  processPendingBillings: () => {
    // Deprecated for client-side calculation
  },

  addClient: async (client) => {
    try {
      await createClientAPI(client);
      await refreshDataFromAPI();
    } catch (e: any) {
      set({ error: e.message || 'Failed to create client' });
    }
  },
  updateClient: async (id, updates) => {
    try {
      await updateClientAPI(id, updates);
      await refreshDataFromAPI();
    } catch (e: any) {
      console.error('updateClient failed:', e);
      set({ error: e.message || 'Failed to update client' });
    }
  },
  deleteClient: async (id) => {
    try {
      await deleteClientAPI(id);
      await refreshDataFromAPI();
    } catch (e: any) {
      set({ error: e.message || 'Failed to delete client' });
    }
  },

  addSubscription: async (sub) => {
    try {
      await createSubscriptionAPI(sub);
      await refreshDataFromAPI();
    } catch (e: any) {
      set({ error: e.message || 'Failed to add subscription' });
    }
  },
  updateSubscription: async (id, updates) => {
    try {
      await updateSubscriptionAPI(id, updates);
      await refreshDataFromAPI();
    } catch (e: any) {
      set({ error: e.message || 'Failed to update subscription' });
    }
  },
  deleteSubscription: async (id) => {
    try {
      await deleteSubscriptionAPI(id);
      await refreshDataFromAPI();
    } catch (e: any) {
      set({ error: e.message || 'Failed to delete subscription' });
    }
  },

  addTransaction: async (tx) => {
    try {
      await createTransactionAPI({ ...tx, isAuto: false, sourceType: 'manual' });
      await refreshDataFromAPI();
    } catch (e: any) {
      set({ error: e.message || 'Failed to create transaction' });
    }
  },
  updateTransaction: async (id, updates) => {
    try {
      await updateTransactionAPI(id, updates);
      await refreshDataFromAPI();
    } catch (e: any) {
      set({ error: e.message || 'Failed to update transaction' });
    }
  },
  deleteTransaction: async (id) => {
    try {
      await deleteTransactionAPI(id);
      await refreshDataFromAPI();
    } catch (e: any) {
      set({ error: e.message || 'Failed to delete transaction' });
    }
  },
  setTransactions: (transactions) => {
    set({ transactions });
    persistLocalSnapshot();
  }
}));
