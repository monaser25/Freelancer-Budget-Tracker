'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Plus } from 'lucide-react';

const pageCopy: Record<string, { title: string; subtitle: string }> = {
  '/': { title: 'Overview', subtitle: 'Your financial snapshot at a glance' },
  '/transactions': { title: 'Transactions', subtitle: 'All your income and expense entries' },
  '/subscriptions': { title: 'Subscriptions', subtitle: 'Recurring tools and client retainers' },
  '/clients': { title: 'Clients & Revenue', subtitle: 'Manage your clients and track income' },
  '/analytics': { title: 'Analytics', subtitle: 'In-depth financial analysis' },
  '/settings': { title: 'Preferences', subtitle: 'Tune the workspace for your freelance finances' },
};

export function Topbar() {
  const pathname = usePathname();
  const copy = pageCopy[pathname] || pageCopy['/'];
  const newTransactionHref = pathname.startsWith('/clients')
    ? '/clients?action=payment'
    : pathname.startsWith('/subscriptions')
      ? '/subscriptions?action=run'
      : '/?action=transaction';

  return (
    <div className="h-[var(--header-h)] bg-sidebar border-b border-border flex items-center justify-between px-7 sticky top-0 z-50">
      <div className="flex flex-col">
        <h1 className="text-[17px] font-semibold tracking-tight text-textPrimary">{copy.title}</h1>
        <p className="text-[12px] text-textMuted">{copy.subtitle}</p>
      </div>
      <div className="flex items-center gap-[10px]">
        <Link href="/transactions" className="inline-flex items-center gap-[6px] px-[14px] py-[8px] rounded-md text-[13px] font-medium cursor-pointer border border-border bg-transparent text-textSecondary hover:bg-slate-100 hover:text-textPrimary transition-all">
          View Ledger
        </Link>
        <a href={newTransactionHref} className="inline-flex items-center gap-[6px] px-[14px] py-[8px] rounded-md text-[13px] font-medium cursor-pointer border-none bg-accent text-white hover:bg-accent-hover transition-all">
          <Plus size={15} /> New Transaction
        </a>
      </div>
    </div>
  );
}
