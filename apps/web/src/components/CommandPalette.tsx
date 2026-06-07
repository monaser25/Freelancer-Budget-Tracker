'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUiStore } from '@/store/uiStore';
import { useFinancialStore } from '@/store/financialStore';
import { useLocale } from '@/lib/i18n';
import { MessageKey } from '@/messages/en';
import { Icon } from '@/components/ui/Icon';
import { Badge } from '@/components/ui/Badge';

interface Command {
  icon: string;
  label: string;
  sub?: string;
  kind: string;
  run: () => void;
}

const PAGES: { icon: string; labelKey: MessageKey; href: string }[] = [
  { icon: 'layoutDashboard', labelKey: 'nav.overview', href: '/' },
  { icon: 'walletCards', labelKey: 'nav.transactions', href: '/transactions' },
  { icon: 'fileText', labelKey: 'nav.invoices', href: '/invoices' },
  { icon: 'users', labelKey: 'nav.clients', href: '/clients' },
  { icon: 'creditCard', labelKey: 'nav.subscriptions', href: '/subscriptions' },
  { icon: 'barChart3', labelKey: 'nav.analytics', href: '/analytics' },
  { icon: 'fileBarChart', labelKey: 'nav.reports', href: '/reports' },
  { icon: 'archive', labelKey: 'nav.archive', href: '/archive' },
  { icon: 'settings', labelKey: 'nav.settings', href: '/settings' },
  { icon: 'bell', labelKey: 'topbar.notifications', href: '/notifications' },
  { icon: 'user', labelKey: 'sidebar.menu.profile', href: '/profile' },
];

export function CommandPalette() {
  const { paletteOpen, setPaletteOpen, openNewModal } = useUiStore();
  const { clients, subscriptions } = useFinancialStore();
  const router = useRouter();
  const { t } = useLocale();
  const inputRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);

  useEffect(() => {
    if (paletteOpen) {
      setQ('');
      setSel(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [paletteOpen]);

  const all = useMemo<Command[]>(() => {
    const close = () => setPaletteOpen(false);
    const actions: Command[] = [
      { icon: 'trendingUp', label: t('commandPalette.actions.addRevenue'), kind: t('commandPalette.groups.actions'), run: () => { close(); openNewModal('income'); } },
      { icon: 'receipt', label: t('commandPalette.actions.logExpense'), kind: t('commandPalette.groups.actions'), run: () => { close(); openNewModal('expense'); } },
      { icon: 'fileText', label: t('commandPalette.actions.newInvoice'), kind: t('commandPalette.groups.actions'), run: () => { close(); router.push('/invoices/new'); } },
      { icon: 'users', label: t('commandPalette.actions.addClient'), kind: t('commandPalette.groups.actions'), run: () => { close(); openNewModal('client'); } },
      { icon: 'creditCard', label: t('commandPalette.actions.addSubscription'), kind: t('commandPalette.groups.actions'), run: () => { close(); openNewModal('subscription'); } },
    ];
    const pages: Command[] = PAGES.map((p) => ({
      icon: p.icon,
      label: t(p.labelKey),
      kind: t('commandPalette.groups.navigation'),
      run: () => { close(); router.push(p.href); },
    }));
    const clientCmds: Command[] = clients
      .filter((c) => !c.archivedAt)
      .map((c) => ({ icon: 'users', label: c.name, sub: c.company, kind: t('commandPalette.groups.recentClients'), run: () => { close(); router.push('/clients'); } }));
    const subCmds: Command[] = subscriptions
      .filter((s) => !s.archivedAt)
      .map((s) => ({ icon: 'creditCard', label: s.name, kind: t('commandPalette.groups.subscriptions'), run: () => { close(); router.push('/subscriptions'); } }));
    return [...actions, ...pages, ...clientCmds, ...subCmds];
  }, [clients, subscriptions, openNewModal, router, setPaletteOpen, t]);

  const filtered = useMemo(
    () =>
      q
        ? all.filter((a) => `${a.label} ${a.sub || ''}`.toLowerCase().includes(q.toLowerCase()))
        : all.slice(0, 10),
    [all, q],
  );

  useEffect(() => {
    if (!paletteOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPaletteOpen(false);
      if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(s + 1, filtered.length - 1)); }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
      if (e.key === 'Enter') { e.preventDefault(); filtered[sel]?.run(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [paletteOpen, filtered, sel, setPaletteOpen]);

  if (!paletteOpen) return null;

  return (
    <div
      onMouseDown={() => setPaletteOpen(false)}
      className="fixed inset-0 z-[250] flex items-start justify-center px-5 backdrop-blur-sm"
      style={{ paddingTop: '12vh', background: 'color-mix(in srgb, var(--bg) 55%, rgba(0,0,0,.55))' }}
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        className="w-full max-w-[560px] bg-surface-elevated border border-border rounded-lg shadow-lg overflow-hidden anim-rise"
      >
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
          <Icon name="search" size={18} className="text-text-muted" />
          <input
            ref={inputRef}
            type="search"
            data-search="true"
            value={q}
            onChange={(e) => { setQ(e.target.value); setSel(0); }}
            placeholder={t('commandPalette.placeholder')}
            className="flex-1 bg-transparent outline-none text-text text-[15px] text-start placeholder:text-text-muted"
          />
          <kbd className="text-[11px] px-1.5 py-0.5 rounded border border-border text-text-muted">Esc</kbd>
        </div>
        <div className="max-h-[360px] overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="py-6 text-center t-body text-text-muted">{t('commandPalette.empty').replace('{q}', q)}</div>
          ) : (
            filtered.map((a, i) => (
              <button
                key={`${a.kind}-${a.label}-${i}`}
                onClick={a.run}
                onMouseEnter={() => setSel(i)}
                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-md text-start transition-colors ${
                  sel === i ? 'bg-surface-hover' : ''
                }`}
              >
                <span className="w-7 h-7 rounded-md bg-accent-tint text-accent flex items-center justify-center shrink-0">
                  <Icon name={a.icon} size={15} />
                </span>
                <span className="flex-1 min-w-0 truncate">
                  <span className="t-body-m">{a.label}</span>
                  {a.sub && <span className="t-small text-text-muted"> · {a.sub}</span>}
                </span>
                <Badge>{a.kind}</Badge>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
