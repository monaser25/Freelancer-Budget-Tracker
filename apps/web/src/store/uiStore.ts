import { create } from 'zustand';

export type NewModalKind = 'income' | 'expense' | 'client' | 'subscription' | null;

const COLLAPSED_KEY = 'haseela-sidebar-collapsed';

const readCollapsed = () => {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(COLLAPSED_KEY) === '1';
  } catch {
    return false;
  }
};

interface UiStore {
  /** Which "New …" modal is open (driven by topbar / palette / sidebar). */
  newModal: NewModalKind;
  openNewModal: (kind: Exclude<NewModalKind, null>) => void;
  closeNewModal: () => void;

  /** Desktop sidebar collapsed (icon-rail) state, persisted. */
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  /** Mobile slide-over nav. */
  mobileNavOpen: boolean;
  setMobileNavOpen: (open: boolean) => void;

  /** Command palette (⌘K). */
  paletteOpen: boolean;
  setPaletteOpen: (open: boolean) => void;
  togglePalette: () => void;
}

export const useUiStore = create<UiStore>((set) => ({
  newModal: null,
  openNewModal: (kind) => set({ newModal: kind }),
  closeNewModal: () => set({ newModal: null }),

  sidebarCollapsed: readCollapsed(),
  toggleSidebar: () =>
    set((state) => {
      const next = !state.sidebarCollapsed;
      try {
        window.localStorage.setItem(COLLAPSED_KEY, next ? '1' : '0');
      } catch {
        /* ignore */
      }
      return { sidebarCollapsed: next };
    }),
  setSidebarCollapsed: (collapsed) => {
    try {
      window.localStorage.setItem(COLLAPSED_KEY, collapsed ? '1' : '0');
    } catch {
      /* ignore */
    }
    set({ sidebarCollapsed: collapsed });
  },

  mobileNavOpen: false,
  setMobileNavOpen: (open) => set({ mobileNavOpen: open }),

  paletteOpen: false,
  setPaletteOpen: (open) => set({ paletteOpen: open }),
  togglePalette: () => set((state) => ({ paletteOpen: !state.paletteOpen })),
}));
