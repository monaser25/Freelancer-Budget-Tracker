'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { Icon } from '@/components/ui/Icon';
import { Avatar } from '@/components/ui/Avatar';

const navItems = [
  { href: '/', label: 'Overview', icon: 'layoutDashboard' },
  { href: '/transactions', label: 'Transactions', icon: 'walletCards' },
  { href: '/subscriptions', label: 'Subscriptions', icon: 'creditCard' },
  { href: '/clients', label: 'Clients & Revenue', icon: 'users' },
  { href: '/analytics', label: 'Analytics', icon: 'barChart3' },
  { href: '/archive', label: 'Archive', icon: 'archive' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const displayName = user?.email?.split('@')[0] || 'Freelancer';

  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
    } catch (e) {
      setIsSigningOut(false);
    }
  };

  return (
    <>
      <aside className="hidden md:flex w-[var(--sidebar-w)] bg-surface border-r border-border flex-col fixed top-0 left-0 h-screen z-[100] p-0 transition-[width] duration-base ease-out">
        {/* brand */}
        <div className="flex items-center gap-[10px] h-[var(--header-h)] px-[18px] border-b border-border shrink-0">
          <div className="w-[30px] h-[30px] rounded-[9px] bg-accent flex items-center justify-center shrink-0 shadow-[0_2px_8px_color-mix(in_srgb,var(--accent)_40%,transparent)]">
            <Icon name="wallet" size={18} className="text-white" />
          </div>
          <span className="text-[16px] font-semibold tracking-[-0.02em] text-text">Haseela</span>
        </div>

        {/* nav */}
        <nav className="flex-1 overflow-y-auto p-3 flex flex-col gap-0.5">
          {navItems.map((item) => {
            const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center gap-[11px] h-[38px] px-[11px] rounded-md text-[14px] transition-colors duration-fast focus-ring ${
                  active 
                    ? 'bg-accent-tint text-accent font-semibold' 
                    : 'bg-transparent text-text-secondary hover:bg-surface-hover hover:text-text font-medium'
                }`}
              >
                {active && (
                  <span className="absolute left-0 top-2 bottom-2 w-[2.5px] rounded-full bg-accent" />
                )}
                <Icon name={item.icon} size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
          
          <div className="flex-1 min-h-[12px]" />
          <div className="h-[1px] bg-border my-[6px] mx-1" />
          
          <Link
            href="/settings"
            className={`relative flex items-center gap-[11px] h-[38px] px-[11px] rounded-md text-[14px] transition-colors duration-fast focus-ring ${
              pathname.startsWith('/settings') 
                ? 'bg-accent-tint text-accent font-semibold' 
                : 'bg-transparent text-text-secondary hover:bg-surface-hover hover:text-text font-medium'
            }`}
          >
            {pathname.startsWith('/settings') && (
              <span className="absolute left-0 top-2 bottom-2 w-[2.5px] rounded-full bg-accent" />
            )}
            <Icon name="settings" size={18} />
            <span>Settings</span>
          </Link>
        </nav>

        {/* user card */}
        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-[10px] p-2 rounded-md transition-colors hover:bg-surface-hover">
            <Avatar name={displayName} size={32} />
            <div className="flex-1 min-w-0 text-left">
              <div className="t-body-m truncate">{displayName}</div>
              <div className="t-small text-text-muted truncate">{user?.email || 'Freelancer'}</div>
            </div>
            <button 
              onClick={handleSignOut} 
              disabled={isSigningOut} 
              className="text-text-muted hover:text-negative p-1 rounded-sm focus-ring disabled:opacity-50 transition-colors" 
              aria-label="Logout"
              title="Log out"
            >
              <LogOut size={15} className={isSigningOut ? 'opacity-50' : ''} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[150] border-t border-border bg-surface shadow-[0_-8px_24px_rgba(15,23,42,0.08)] overflow-x-auto pb-[env(safe-area-inset-bottom)]">
        <div className="flex min-w-max px-2 py-2">
          {[...navItems, { href: '/settings', label: 'Settings', icon: 'settings' }].map((item) => {
            const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`min-w-[78px] flex flex-col items-center justify-center gap-1 rounded-md px-2 py-2 text-[11px] transition-colors ${
                  active ? 'bg-accent-tint text-accent font-semibold' : 'text-text-muted hover:bg-surface-hover hover:text-text-secondary font-medium'
                }`}
              >
                <Icon name={item.icon} size={18} />
                <span className="max-w-[70px] truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

export default Sidebar;
