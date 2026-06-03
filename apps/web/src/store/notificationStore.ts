import { create } from 'zustand';

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body?: string | null;
  link?: string | null;
  read: boolean;
  createdAt: string;
}

import { getSupabaseBrowserClient } from '@/lib/supabaseClient';
import { getDevAuthHeaders, isDevAuthEnabled } from '@/lib/devAuth';

const authHeaders = async (): Promise<Record<string, string>> => {
  if (isDevAuthEnabled()) {
    const headers = getDevAuthHeaders();
    if (!headers) throw new Error('Missing local development session.');
    return headers;
  }
  const { data, error } = await getSupabaseBrowserClient().auth.getSession();
  if (error || !data.session?.access_token) throw new Error('Missing authenticated Supabase session.');
  return { Authorization: `Bearer ${data.session.access_token}` };
};

interface NotificationStore {
  notifications: AppNotification[];
  unread: number;
  isLoaded: boolean;
  load: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  reset: () => void;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unread: 0,
  isLoaded: false,

  load: async () => {
    try {
      const res = await fetch('/api/notifications', { headers: await authHeaders(), cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      set({ notifications: data.notifications || [], unread: data.unread || 0, isLoaded: true });
    } catch {
      set({ isLoaded: true });
    }
  },

  markRead: async (id) => {
    set((s) => ({
      notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
      unread: Math.max(0, s.unread - (get().notifications.find((n) => n.id === id && !n.read) ? 1 : 0)),
    }));
    try {
      await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
        body: JSON.stringify({ id }),
      });
    } catch {
      /* optimistic; will reconcile on next load */
    }
  },

  markAllRead: async () => {
    set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })), unread: 0 }));
    try {
      await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
        body: JSON.stringify({}),
      });
    } catch {
      /* optimistic */
    }
  },

  reset: () => set({ notifications: [], unread: 0, isLoaded: false }),
}));
