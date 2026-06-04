'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useUiStore } from '@/store/uiStore';
import { useTheme } from '@/components/ThemeProvider';
import { Icon } from '@/components/ui/Icon';
import { Avatar } from '@/components/ui/Avatar';
import { Menu } from '@/components/ui/Menu';

const PRIMARY_NAV = [
  { href: '/', label: 'Overview', icon: 'layoutDashboard' },
  { href: '/transactions', label: 'Transactions', icon: 'walletCards' },
  { href: '/invoices', label: 'Invoices', icon: 'fileText' },
  { href: '/clients', label: 'Clients & Revenue', icon: 'users' },
  { href: '/subscriptions', label: 'Subscriptions', icon: 'creditCard' },
  { href: '/analytics', label: 'Analytics', icon: 'barChart3' },
  { href: '/reports', label: 'Reports', icon: 'fileBarChart' },
];

const SECONDARY_NAV = [
  { href: '/archive', label: 'Archive', icon: 'archive' },
  { href: '/settings', label: 'Settings', icon: 'settings' },
];

function isActive(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname.startsWith(href);
}

function NavLink({
  item,
  active,
  collapsed,
  onNavigate,
}: {
  item: { href: string; label: string; icon: string };
  active: boolean;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      onClick={onNavigate}
      className={`relative flex items-center gap-[11px] h-[38px] rounded-md text-[14px] transition-colors duration-fast focus-ring ${
        collapsed ? 'justify-center px-0' : 'px-[11px]'
      } ${
        active
          ? 'bg-accent-tint text-accent font-semibold'
          : 'bg-transparent text-text-secondary hover:bg-surface-hover hover:text-text font-medium'
      }`}
    >
      {active && <span className="absolute left-0 top-2 bottom-2 w-[2.5px] rounded-full bg-accent" />}
      <Icon name={item.icon} size={18} />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  );
}

export function Sidebar({ mobile, onClose }: { mobile?: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { sidebarCollapsed, toggleSidebar } = useUiStore();
  const { resolvedTheme, toggleTheme } = useTheme();

  const collapsed = mobile ? false : sidebarCollapsed;
  const displayName = (user?.user_metadata?.name as string) || user?.email?.split('@')[0] || 'Freelancer';

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
      className="h-full bg-surface border-r border-border flex flex-col shrink-0 transition-[width] duration-base ease-out"
    >
      {/* Brand */}
      <div
        className={`h-[var(--header-h)] flex items-center gap-2.5 border-b border-border shrink-0 ${
          collapsed ? 'justify-center px-0' : 'px-[18px]'
        }`}
      >
        <Link href="/" onClick={onClose} className="flex items-center gap-2.5 focus-ring rounded-md">
          <div className="w-[30px] h-[30px] rounded-[9px] bg-accent flex items-center justify-center shrink-0 shadow-[0_2px_8px_color-mix(in_srgb,var(--accent)_40%,transparent)]">
            <Icon name="wallet" size={18} className="text-white" />
          </div>
          {!collapsed && <span className="text-[16px] font-semibold tracking-[-0.02em] text-text">Haseeela</span>}
        </Link>
      </div>

      {/* Nav */}
      <nav className={`flex-1 overflow-y-auto flex flex-col gap-0.5 ${collapsed ? 'p-2.5' : 'p-3'}`}>
        {PRIMARY_NAV.map((item) => (
          <NavLink key={item.href} item={item} active={isActive(pathname, item.href)} collapsed={collapsed} onNavigate={onClose} />
        ))}
        <div className="flex-1 min-h-[12px]" />
        <div className="h-px bg-border my-1.5 mx-1" />
        {SECONDARY_NAV.map((item) => (
          <NavLink key={item.href} item={item} active={isActive(pathname, item.href)} collapsed={collapsed} onNavigate={onClose} />
        ))}
      </nav>

      {/* User card */}
      <div className={`border-t border-border ${collapsed ? 'p-2.5 flex justify-center' : 'p-3'}`}>
        <Menu
          align="left"
          width={210}
          side="top"
          trigger={
            <button
              className={`flex items-center gap-2.5 rounded-md transition-colors hover:bg-surface-hover focus-ring ${
                collapsed ? 'justify-center w-10 h-10 p-0' : 'w-full p-2'
              }`}
            >
              <Avatar name={displayName} size={32} />
              {!collapsed && (
                <>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="t-body-m truncate">{displayName}</div>
                    <div className="t-small text-text-muted truncate">{user?.email || 'Freelancer'}</div>
                  </div>
                  <Icon name="chevronDown" size={15} className="text-text-muted" />
                </>
              )}
            </button>
          }
          items={[
            { icon: 'user', label: 'Profile', onClick: () => router.push('/profile') },
            { icon: 'settings', label: 'Settings', onClick: () => router.push('/settings') },
            { icon: resolvedTheme === 'dark' ? 'sun' : 'moon', label: resolvedTheme === 'dark' ? 'Light mode' : 'Dark mode', onClick: toggleTheme },
            { divider: true },
            { icon: 'logOut', label: 'Log out', onClick: handleSignOut, danger: true },
          ]}
        />
      </div>

      {/* Collapse toggle (desktop only) */}
      {!mobile && (
        <button
          onClick={toggleSidebar}
          title="Toggle sidebar"
          className="h-9 border-t border-border bg-transparent text-text-muted hover:text-text hover:bg-surface-hover flex items-center justify-center gap-2 focus-ring transition-colors"
        >
          <Icon name="panelLeft" size={16} />
          {!collapsed && <span className="t-small">Collapse</span>}
        </button>
      )}
    </aside>
  );
}

export default Sidebar;
