'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, CreditCard, LayoutDashboard, LogOut, Settings, Users, WalletCards } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';

const navItems = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/transactions', label: 'Transactions', icon: WalletCards },
  { href: '/subscriptions', label: 'Subscriptions', icon: CreditCard },
  { href: '/clients', label: 'Clients & Revenue', icon: Users },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const displayName = user?.email?.split('@')[0] || 'Freelancer';
  const initials = displayName.slice(0, 2).toUpperCase();

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
      <aside className="hidden md:flex w-[var(--sidebar-w)] bg-sidebar border-r border-border flex-col fixed top-0 left-0 h-screen z-[100] p-0">
        <div className="flex items-center gap-[10px] p-[18px_20px] border-b border-border">
          <div className="w-8 h-8 bg-accent rounded-md flex items-center justify-center text-white text-[15px] font-semibold">
            FL
          </div>
          <div>
            <div className="text-[15px] font-semibold tracking-tight text-textPrimary">FlowLedger</div>
          </div>
        </div>
        <nav className="flex-1 p-3 overflow-y-auto">
          <div className="text-[10px] font-semibold tracking-wider text-textMuted uppercase p-[8px_8px_4px]">Main</div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-[10px] p-[8px_10px] rounded-md cursor-pointer transition-all mb-[2px] text-[13.5px] ${
                  active ? 'bg-accent-light text-accent font-medium' : 'text-textSecondary hover:bg-slate-100 hover:text-textPrimary'
                }`}
              >
                <Icon size={15} />
                {item.label}
              </Link>
            );
          })}

          <div className="text-[10px] font-semibold tracking-wider text-textMuted uppercase p-[8px_8px_4px] mt-3">Settings</div>
          <Link
            href="/settings"
            className={`flex items-center gap-[10px] p-[8px_10px] rounded-md cursor-pointer transition-all mb-[2px] text-[13.5px] ${
              pathname.startsWith('/settings') ? 'bg-accent-light text-accent font-medium' : 'text-textSecondary hover:bg-slate-100 hover:text-textPrimary'
            }`}
          >
            <Settings size={15} />
            Preferences
          </Link>
        </nav>
        <div className="p-[14px_12px] border-t border-border">
          <div className="flex items-center gap-[10px] p-[8px_10px] rounded-md">
            <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center text-[13px] font-semibold shrink-0">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-medium text-textPrimary truncate">{displayName}</div>
              <div className="text-[11px] text-textMuted">Freelancer</div>
            </div>
            <button onClick={handleSignOut} disabled={isSigningOut} className="text-textMuted hover:text-textPrimary p-1 disabled:opacity-50" aria-label="Logout">
              <LogOut size={14} className={isSigningOut ? 'opacity-50' : ''} />
            </button>
          </div>
        </div>
      </aside>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[150] border-t border-border bg-white/95 backdrop-blur shadow-[0_-8px_24px_rgba(15,23,42,0.08)] overflow-x-auto">
        <div className="flex min-w-max px-2 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
          {[...navItems, { href: '/settings', label: 'Settings', icon: Settings }].map((item) => {
            const Icon = item.icon;
            const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`min-w-[78px] flex flex-col items-center justify-center gap-1 rounded-md px-2 py-2 text-[11px] transition-all ${
                  active ? 'bg-accent-light text-accent font-semibold' : 'text-textMuted hover:bg-slate-100 hover:text-textSecondary'
                }`}
              >
                <Icon size={16} />
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
