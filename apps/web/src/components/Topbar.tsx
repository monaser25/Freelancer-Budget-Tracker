'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useUiStore } from '@/store/uiStore';
import { useNotificationStore } from '@/store/notificationStore';
import { useTheme } from '@/components/ThemeProvider';
import { useLocale } from '@/lib/i18n';
import { MessageKey } from '@/messages/en';
import { Icon } from '@/components/ui/Icon';
import { Button, IconButton } from '@/components/ui/Button';
import { Menu } from '@/components/ui/Menu';
import { LanguageToggle } from '@/components/ui/LanguageToggle';

const PAGE_COPY: Record<string, { titleKey: MessageKey; subtitleKey: MessageKey }> = {
  '/': { titleKey: 'topbar.copy.overview.title', subtitleKey: 'topbar.copy.overview.subtitle' },
  '/transactions': { titleKey: 'topbar.copy.transactions.title', subtitleKey: 'topbar.copy.transactions.subtitle' },
  '/invoices': { titleKey: 'topbar.copy.invoices.title', subtitleKey: 'topbar.copy.invoices.subtitle' },
  '/clients': { titleKey: 'topbar.copy.clients.title', subtitleKey: 'topbar.copy.clients.subtitle' },
  '/subscriptions': { titleKey: 'topbar.copy.subscriptions.title', subtitleKey: 'topbar.copy.subscriptions.subtitle' },
  '/analytics': { titleKey: 'topbar.copy.analytics.title', subtitleKey: 'topbar.copy.analytics.subtitle' },
  '/reports': { titleKey: 'topbar.copy.reports.title', subtitleKey: 'topbar.copy.reports.subtitle' },
  '/archive': { titleKey: 'topbar.copy.archive.title', subtitleKey: 'topbar.copy.archive.subtitle' },
  '/settings': { titleKey: 'topbar.copy.settings.title', subtitleKey: 'topbar.copy.settings.subtitle' },
  '/profile': { titleKey: 'topbar.copy.profile.title', subtitleKey: 'topbar.copy.profile.subtitle' },
  '/notifications': { titleKey: 'topbar.copy.notifications.title', subtitleKey: 'topbar.copy.notifications.subtitle' },
};

function copyFor(pathname: string) {
  if (PAGE_COPY[pathname]) return PAGE_COPY[pathname];
  // Match nested routes (e.g. /invoices/new) to their section.
  const section = `/${pathname.split('/')[1] || ''}`;
  return PAGE_COPY[section] || { titleKey: 'topbar.copy.fallback.title', subtitleKey: 'topbar.copy.fallback.subtitle' };
}

export function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { setPaletteOpen, setMobileNavOpen, openNewModal } = useUiStore();
  const unreadCount = useNotificationStore((s) => s.unread);
  const { resolvedTheme, toggleTheme } = useTheme();
  const { t } = useLocale();
  const copy = copyFor(pathname);

  return (
    <header className="h-[var(--header-h)] shrink-0 border-b border-border bg-surface flex items-center gap-3.5 px-5 sticky top-0 z-40">
      <button
        onClick={() => setMobileNavOpen(true)}
        aria-label={t('topbar.openNav')}
        className="lg:hidden text-text-secondary hover:text-text p-1 focus-ring rounded-sm transition-colors"
      >
        <Icon name="menu" size={20} />
      </button>

      <div className="min-w-0">
        <h1 className="t-h2 truncate">{t(copy.titleKey)}</h1>
      </div>

      <div className="flex-1" />

      {/* Search → command palette */}
      <button
        onClick={() => setPaletteOpen(true)}
        className="hidden sm:flex items-center gap-2.5 h-9 px-3 min-w-[200px] rounded-md border border-border bg-background text-text-muted hover:border-border-strong focus-ring transition-colors"
      >
        <Icon name="search" size={16} />
        <span className="t-body flex-1 text-start">{t('topbar.search')}</span>
      </button>
      <IconButton icon="search" title={t('topbar.search')} className="sm:hidden" onClick={() => setPaletteOpen(true)} />

      <LanguageToggle minimal />
      <IconButton icon={resolvedTheme === 'dark' ? 'sun' : 'moon'} title={t('topbar.toggleTheme')} onClick={toggleTheme} />
      <IconButton
        icon="bell"
        title={t('topbar.notifications')}
        badge={unreadCount > 0}
        onClick={() => router.push('/notifications')}
      />

      <Menu
        align="right"
        trigger={<Button icon="plus" iconRight="chevronDown" size="md">{t('topbar.new')}</Button>}
        items={[
          { icon: 'trendingUp', label: t('topbar.menu.addRevenue'), onClick: () => openNewModal('income') },
          { icon: 'receipt', label: t('topbar.menu.logExpense'), onClick: () => openNewModal('expense') },
          { icon: 'fileText', label: t('topbar.menu.newInvoice'), onClick: () => router.push('/invoices/new') },
          { icon: 'users', label: t('topbar.menu.addClient'), onClick: () => openNewModal('client') },
          { icon: 'creditCard', label: t('topbar.menu.addSubscription'), onClick: () => openNewModal('subscription') },
        ]}
      />
    </header>
  );
}
