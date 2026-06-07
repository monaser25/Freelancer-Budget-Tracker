'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useUiStore } from '@/store/uiStore';
import { useTheme } from '@/components/ThemeProvider';
import { useLocale } from '@/lib/i18n';
import { MessageKey } from '@/messages/en';
import { Icon } from '@/components/ui/Icon';
import { Avatar } from '@/components/ui/Avatar';
import { Menu } from '@/components/ui/Menu';

const PRIMARY_NAV: { href: string; labelKey: MessageKey; icon: string }[] = [
  { href: '/', labelKey: 'nav.overview', icon: 'layoutDashboard' },
  { href: '/transactions', labelKey: 'nav.transactions', icon: 'walletCards' },
  { href: '/invoices', labelKey: 'nav.invoices', icon: 'fileText' },
  { href: '/clients', labelKey: 'nav.clients', icon: 'users' },
  { href: '/subscriptions', labelKey: 'nav.subscriptions', icon: 'creditCard' },
  { href: '/analytics', labelKey: 'nav.analytics', icon: 'barChart3' },
  { href: '/reports', labelKey: 'nav.reports', icon: 'fileBarChart' },
];

const SECONDARY_NAV: { href: string; labelKey: MessageKey; icon: string }[] = [
  { href: '/archive', labelKey: 'nav.archive', icon: 'archive' },
  { href: '/settings', labelKey: 'nav.settings', icon: 'settings' },
];

function isActive(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname.startsWith(href);
}

// A fixed-width icon slot. Brand logo, every nav icon and the avatar share this
// slot so they all sit on the same vertical axis (the rail's centre). Nothing
// moves horizontally when the sidebar collapses — only labels fade out and the
// width animates, which is what makes the collapse feel intentional.
const SLOT = 'grid place-items-center w-11 shrink-0';

// Collapsible label: shrinks to zero width when collapsed (so it never spills
// past the rail or shifts the icon) and fades/slides for a premium feel.
function labelStyle(collapsed: boolean, extra = '') {
  return `flex-1 min-w-0 truncate transition-[opacity,transform] duration-200 ease-out ${
    collapsed ? 'opacity-0 rtl:translate-x-1 ltr:-translate-x-1' : 'opacity-100 translate-x-0'
  } ${extra}`;
}

function NavLink({
  item,
  active,
  collapsed,
  onNavigate,
  label,
}: {
  item: { href: string; labelKey: MessageKey; icon: string };
  active: boolean;
  collapsed: boolean;
  onNavigate?: () => void;
  label: string;
}) {
  return (
    <Link
      href={item.href}
      title={collapsed ? label : undefined}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      className={`group relative flex items-center w-full h-[40px] rounded-md focus-ring transition-colors duration-base ease-out ${
        active
          ? 'bg-accent-tint text-accent font-semibold'
          : 'text-text-secondary hover:bg-surface-hover hover:text-text font-medium'
      }`}
    >
      {/* Active rail indicator */}
      <span
        className={`absolute start-0 top-1/2 -translate-y-1/2 w-[3px] h-[18px] rounded-e-full bg-accent transition-opacity duration-base ease-out ${
          active ? 'opacity-100' : 'opacity-0'
        }`}
      />
      <span className={SLOT}>
        <Icon name={item.icon} size={18} />
      </span>
      <span className={labelStyle(collapsed, 'text-[14px] pe-3 text-start')}>{label}</span>
    </Link>
  );
}

export function Sidebar({ mobile, onClose }: { mobile?: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { sidebarCollapsed, toggleSidebar } = useUiStore();
  const { resolvedTheme, toggleTheme } = useTheme();
  const { t } = useLocale();

  const collapsed = mobile ? false : sidebarCollapsed;
  const displayName = (user?.user_metadata?.name as string) || user?.email?.split('@')[0] || t('sidebar.fallback.freelancer');

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/login');
    } catch {
      /* AuthProvider surfaces errors */
    }
  };

  return (
    <aside
      style={{ width: collapsed ? 'var(--sidebar-rail)' : 'var(--sidebar-w)' }}
      className="h-full bg-surface border-e border-border flex flex-col shrink-0 transition-[width] duration-slow ease-out"
    >
      {/* Brand */}
      <div className="h-[var(--header-h)] flex items-center border-b border-border shrink-0 px-3.5">
        <Link href="/" onClick={onClose} className="flex items-center w-full rounded-md focus-ring">
          <span className={SLOT}>
            <span className="w-9 h-9 rounded-[9px] bg-white flex items-center justify-center shadow-sm overflow-hidden ring-1 ring-black/5">
              <Image src="/haseeela_icon.png" alt={`${t('brand.name')} logo`} width={44} height={44} className="h-11 w-11 max-w-none object-cover" />
            </span>
          </span>
          <span className={labelStyle(collapsed, 'text-[16px] font-semibold tracking-[-0.02em] text-text')}>
            {t('brand.name')}
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-x-hidden overflow-y-auto flex flex-col gap-0.5 px-3.5 py-3">
        {PRIMARY_NAV.map((item) => (
          <NavLink key={item.href} item={item} active={isActive(pathname, item.href)} collapsed={collapsed} onNavigate={onClose} label={t(item.labelKey)} />
        ))}
        <div className="flex-1 min-h-[12px]" />
        <div className="h-px bg-border my-1.5 mx-2" />
        {SECONDARY_NAV.map((item) => (
          <NavLink key={item.href} item={item} active={isActive(pathname, item.href)} collapsed={collapsed} onNavigate={onClose} label={t(item.labelKey)} />
        ))}
      </nav>

      {/* User card */}
      <div className="border-t border-border px-3.5 py-3">
        <Menu
          className="w-full"
          align="left"
          width={210}
          side="top"
          trigger={
            <button
              title={collapsed ? displayName : undefined}
              className="flex items-center w-full rounded-lg py-2 hover:bg-surface-hover focus-ring transition-colors duration-base ease-out"
            >
              <span className={SLOT}>
                <Avatar name={displayName} size={34} />
              </span>
              <span
                className={`flex-1 min-w-0 flex items-center overflow-hidden pe-2 transition-[opacity,transform] duration-200 ease-out ${
                  collapsed ? 'opacity-0 rtl:translate-x-1 ltr:-translate-x-1 pointer-events-none' : 'opacity-100 translate-x-0'
                }`}
              >
                <span className="flex-1 min-w-0 text-start">
                  <span className="block t-body-m text-text truncate">{displayName}</span>
                  <span className="block t-small text-text-muted truncate"><span dir="ltr">{user?.email || t('sidebar.fallback.freelancer')}</span></span>
                </span>
                <Icon name="chevronDown" size={15} className="text-text-muted ms-1.5 shrink-0" />
              </span>
            </button>
          }
          items={[
            { icon: 'user', label: t('sidebar.menu.profile'), onClick: () => router.push('/profile') },
            { icon: 'settings', label: t('sidebar.menu.settings'), onClick: () => router.push('/settings') },
            { icon: resolvedTheme === 'dark' ? 'sun' : 'moon', label: resolvedTheme === 'dark' ? t('sidebar.menu.lightMode') : t('sidebar.menu.darkMode'), onClick: toggleTheme },
            { divider: true },
            { icon: 'logOut', label: t('sidebar.menu.logOut'), onClick: handleSignOut, danger: true },
          ]}
        />
      </div>

      {/* Bottom Actions */}
      {!mobile && (
        <div className="flex items-center border-t border-border h-10 w-full overflow-hidden">
          <button
            onClick={toggleSidebar}
            title={collapsed ? t('sidebar.tooltip.expand') : t('sidebar.tooltip.collapse')}
            aria-label={collapsed ? t('sidebar.tooltip.expand') : t('sidebar.tooltip.collapse')}
            className="flex-1 h-full text-text-muted hover:text-text hover:bg-surface-hover flex items-center px-3.5 focus-ring transition-colors duration-base ease-out min-w-0"
          >
            <span className={SLOT}>
              <Icon
                name="panelLeft"
                size={17}
                className={`transition-transform duration-slow ease-out ${collapsed ? 'rotate-180' : ''}`}
              />
            </span>
            <span className={labelStyle(collapsed, 't-small text-start')}>{t('sidebar.collapse')}</span>
          </button>
        </div>
      )}
    </aside>
  );
}

export default Sidebar;
