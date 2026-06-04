'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useUiStore } from '@/store/uiStore';
import { useNotificationStore } from '@/store/notificationStore';
import { useTheme } from '@/components/ThemeProvider';
import { Icon } from '@/components/ui/Icon';
import { Button, IconButton } from '@/components/ui/Button';
import { Menu } from '@/components/ui/Menu';

const PAGE_COPY: Record<string, { title: string; subtitle: string }> = {
  '/': { title: 'Overview', subtitle: 'Your money at a glance' },
  '/transactions': { title: 'Transactions', subtitle: 'Every dollar in and out' },
  '/invoices': { title: 'Invoices', subtitle: 'Bill clients and track payment' },
  '/clients': { title: 'Clients & Revenue', subtitle: 'Who pays you, and how much' },
  '/subscriptions': { title: 'Subscriptions', subtitle: 'Recurring tools & software' },
  '/analytics': { title: 'Analytics', subtitle: 'Trends across periods' },
  '/reports': { title: 'Reports', subtitle: 'Generate & export statements' },
  '/archive': { title: 'Archive', subtitle: 'Restore past clients & tools' },
  '/settings': { title: 'Settings', subtitle: 'Account & workspace' },
  '/profile': { title: 'Profile', subtitle: 'Your personal details' },
  '/notifications': { title: 'Notifications', subtitle: 'Reminders & events' },
};

function copyFor(pathname: string) {
  if (PAGE_COPY[pathname]) return PAGE_COPY[pathname];
  // Match nested routes (e.g. /invoices/new) to their section.
  const section = `/${pathname.split('/')[1] || ''}`;
  return PAGE_COPY[section] || { title: 'Haseeela', subtitle: '' };
}

export function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { setPaletteOpen, setMobileNavOpen, openNewModal } = useUiStore();
  const unreadCount = useNotificationStore((s) => s.unread);
  const { resolvedTheme, toggleTheme } = useTheme();
  const copy = copyFor(pathname);

  return (
    <header className="h-[var(--header-h)] shrink-0 border-b border-border bg-surface flex items-center gap-3.5 px-5 sticky top-0 z-40">
      <button
        onClick={() => setMobileNavOpen(true)}
        aria-label="Open navigation"
        className="lg:hidden text-text-secondary hover:text-text p-1 focus-ring rounded-sm transition-colors"
      >
        <Icon name="menu" size={20} />
      </button>

      <div className="min-w-0">
        <h1 className="t-h2 truncate">{copy.title}</h1>
      </div>

      <div className="flex-1" />

      {/* Search → command palette */}
      <button
        onClick={() => setPaletteOpen(true)}
        className="hidden sm:flex items-center gap-2.5 h-9 px-3 min-w-[200px] rounded-md border border-border bg-background text-text-muted hover:border-border-strong focus-ring transition-colors"
      >
        <Icon name="search" size={16} />
        <span className="t-body flex-1 text-left">Search…</span>
      </button>
      <IconButton icon="search" title="Search" className="sm:hidden" onClick={() => setPaletteOpen(true)} />

      <IconButton icon={resolvedTheme === 'dark' ? 'sun' : 'moon'} title="Toggle theme" onClick={toggleTheme} />
      <IconButton
        icon="bell"
        title="Notifications"
        badge={unreadCount > 0}
        onClick={() => router.push('/notifications')}
      />

      <Menu
        align="right"
        trigger={<Button icon="plus" iconRight="chevronDown" size="md">New</Button>}
        items={[
          { icon: 'trendingUp', label: 'Add revenue', onClick: () => openNewModal('income') },
          { icon: 'receipt', label: 'Log expense', onClick: () => openNewModal('expense') },
          { icon: 'fileText', label: 'New invoice', onClick: () => router.push('/invoices/new') },
          { icon: 'users', label: 'Add client', onClick: () => openNewModal('client') },
          { icon: 'creditCard', label: 'Add subscription', onClick: () => openNewModal('subscription') },
        ]}
      />
    </header>
  );
}
