import { create } from 'zustand';
import { Invoice } from '@/types/finance';
import {
  loadInvoicesAPI,
  createInvoiceAPI,
  updateInvoiceAPI,
  deleteInvoiceAPI,
  markInvoicePaidAPI,
  sendInvoiceAPI,
  type InvoiceInput,
} from '@/services/financialApi';
import { useFinancialStore } from '@/store/financialStore';

interface InvoiceStore {
  invoices: Invoice[];
  isLoading: boolean;
  isLoaded: boolean;
  error: string | null;

  loadInvoices: () => Promise<void>;
  createInvoice: (input: InvoiceInput) => Promise<Invoice>;
  updateInvoice: (id: string, input: InvoiceInput) => Promise<Invoice>;
  deleteInvoice: (id: string) => Promise<void>;
  markPaid: (id: string) => Promise<void>;
  send: (id: string) => Promise<void>;
  getInvoice: (id: string) => Invoice | undefined;
  reset: () => void;
}

// After mutations that touch transactions (mark paid), refresh the financial
// snapshot so the new income transaction appears in the ledger/overview.
const refreshFinancials = async () => {
  try {
    const { loadFinancialSnapshot } = await import('@/services/financialApi');
    const data = await loadFinancialSnapshot();
    useFinancialStore.getState().setInitialData(data);
  } catch {
    /* keep current state; the ledger will catch up on next load */
  }
};

export const useInvoiceStore = create<InvoiceStore>((set, get) => ({
  invoices: [],
  isLoading: false,
  isLoaded: false,
  error: null,

  loadInvoices: async () => {
    set({ isLoading: true });
    try {
      const { invoices } = await loadInvoicesAPI();
      set({ invoices, isLoading: false, isLoaded: true, error: null });
    } catch (e: any) {
      set({ isLoading: false, error: e?.message || 'Failed to load invoices' });
    }
  },

  createInvoice: async (input) => {
    const created = await createInvoiceAPI(input);
    set((state) => ({ invoices: [created, ...state.invoices], error: null }));
    return created;
  },

  updateInvoice: async (id, input) => {
    const updated = await updateInvoiceAPI(id, input);
    set((state) => ({ invoices: state.invoices.map((i) => (i.id === id ? updated : i)), error: null }));
    return updated;
  },

  deleteInvoice: async (id) => {
    await deleteInvoiceAPI(id);
    set((state) => ({ invoices: state.invoices.filter((i) => i.id !== id), error: null }));
  },

  markPaid: async (id) => {
    const { invoice } = await markInvoicePaidAPI(id);
    set((state) => ({ invoices: state.invoices.map((i) => (i.id === id ? invoice : i)), error: null }));
    await refreshFinancials();
  },

  send: async (id) => {
    const updated = await sendInvoiceAPI(id);
    set((state) => ({ invoices: state.invoices.map((i) => (i.id === id ? updated : i)), error: null }));
  },

  getInvoice: (id) => get().invoices.find((i) => i.id === id),

  reset: () => set({ invoices: [], isLoading: false, isLoaded: false, error: null }),
}));
