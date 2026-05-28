'use client';

import { useMemo, useState } from 'react';
import { useFinancialStore } from '@/store/useFinancialStore';
import { makeCurrencyFormatter } from '@/lib/currency';
import { Archive, RotateCcw, Users, CreditCard } from 'lucide-react';

export default function ArchivePage() {
  const { clients, subscriptions, transactions, currency, restoreClient, restoreSubscription } = useFinancialStore();
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const money = useMemo(() => makeCurrencyFormatter(currency, { maximumFractionDigits: 0 }), [currency]);

  const archivedClients = useMemo(
    () => clients.filter((c) => c.archivedAt),
    [clients],
  );
  const archivedSubscriptions = useMemo(
    () => subscriptions.filter((s) => s.archivedAt),
    [subscriptions],
  );

  const clientTransactionCount = (clientId: string) =>
    transactions.filter((tx) => tx.clientId === clientId || (tx.sourceType === 'client' && tx.sourceId === clientId)).length;

  const subscriptionTransactionCount = (subscriptionId: string) =>
    transactions.filter((tx) => tx.subscriptionId === subscriptionId || (tx.sourceType === 'subscription' && tx.sourceId === subscriptionId)).length;

  const handleRestoreClient = async (id: string) => {
    setRestoringId(id);
    setError(null);
    try {
      await restoreClient(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to restore client');
    } finally {
      setRestoringId(null);
    }
  };

  const handleRestoreSubscription = async (id: string) => {
    setRestoringId(id);
    setError(null);
    try {
      await restoreSubscription(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to restore subscription');
    } finally {
      setRestoringId(null);
    }
  };

  const isEmpty = archivedClients.length === 0 && archivedSubscriptions.length === 0;

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-100 rounded-[var(--radius-lg)] p-4 text-[13px] text-blue-700">
        Archived items do not generate future billing. Historical transactions remain in your ledger.
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-[var(--radius-lg)] px-4 py-3 text-[13px] text-red-600">
          {error}
        </div>
      )}

      {isEmpty ? (
        <div className="bg-card border border-border rounded-[var(--radius-lg)] p-10 text-center">
          <div className="flex justify-center mb-3 text-slate-300"><Archive size={34} /></div>
          <p className="text-[13px] text-textMuted">No archived items. Clients and subscriptions you remove will appear here.</p>
        </div>
      ) : (
        <>
          {archivedClients.length > 0 && (
            <div className="bg-card border border-border rounded-[var(--radius-lg)] overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-border flex items-center gap-2">
                <Users size={15} className="text-textSecondary" />
                <h2 className="text-[14px] font-semibold text-textPrimary">Archived Clients</h2>
                <span className="text-[12px] text-textMuted ml-1">({archivedClients.length})</span>
              </div>
              <div className="divide-y divide-slate-50">
                {archivedClients.map((client) => (
                  <div key={client.id} className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-[13px] font-semibold shrink-0">
                        {client.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[13.5px] font-medium text-textPrimary">{client.name}</span>
                          <Badge tone="slate">{client.paymentType === 'retainer' ? 'Retainer' : 'One-time'}</Badge>
                        </div>
                        <div className="text-[12px] text-textMuted mt-0.5">
                          {money.format(client.revenue)}/mo
                          {' · '}
                          {clientTransactionCount(client.id)} historical transaction{clientTransactionCount(client.id) === 1 ? '' : 's'}
                          {client.archivedAt && (
                            <>
                              {' · '}
                              Archived {new Date(client.archivedAt).toLocaleDateString()}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={restoringId === client.id}
                      onClick={() => handleRestoreClient(client.id)}
                      className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md border border-border text-[13px] font-medium text-textSecondary hover:bg-slate-100 hover:text-textPrimary disabled:opacity-60 sm:w-auto"
                    >
                      <RotateCcw size={14} />
                      {restoringId === client.id ? 'Restoring...' : 'Restore'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {archivedSubscriptions.length > 0 && (
            <div className="bg-card border border-border rounded-[var(--radius-lg)] overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-border flex items-center gap-2">
                <CreditCard size={15} className="text-textSecondary" />
                <h2 className="text-[14px] font-semibold text-textPrimary">Archived Subscriptions</h2>
                <span className="text-[12px] text-textMuted ml-1">({archivedSubscriptions.length})</span>
              </div>
              <div className="divide-y divide-slate-50">
                {archivedSubscriptions.map((sub) => (
                  <div key={sub.id} className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-[13px] font-semibold shrink-0">
                        <CreditCard size={16} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[13.5px] font-medium text-textPrimary">{sub.name}</span>
                          <Badge tone="slate">{(sub.billingCycle || sub.cycle).toLowerCase()}</Badge>
                        </div>
                        <div className="text-[12px] text-textMuted mt-0.5">
                          {money.format(sub.amount)}/{(sub.billingCycle || sub.cycle) === 'YEARLY' ? 'yr' : (sub.billingCycle || sub.cycle) === 'QUARTERLY' ? 'qtr' : 'mo'}
                          {' · '}
                          {subscriptionTransactionCount(sub.id)} historical transaction{subscriptionTransactionCount(sub.id) === 1 ? '' : 's'}
                          {sub.archivedAt && (
                            <>
                              {' · '}
                              Archived {new Date(sub.archivedAt).toLocaleDateString()}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={restoringId === sub.id}
                      onClick={() => handleRestoreSubscription(sub.id)}
                      className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md border border-border text-[13px] font-medium text-textSecondary hover:bg-slate-100 hover:text-textPrimary disabled:opacity-60 sm:w-auto"
                    >
                      <RotateCcw size={14} />
                      {restoringId === sub.id ? 'Restoring...' : 'Restore'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Badge({ children, tone }: { children: React.ReactNode; tone: 'blue' | 'green' | 'amber' | 'slate' }) {
  const classes = {
    blue: 'bg-blue-50 text-accent',
    green: 'bg-green-50 text-green-700',
    amber: 'bg-amber-50 text-amber-600',
    slate: 'bg-slate-100 text-textSecondary',
  };
  return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${classes[tone]}`}>{children}</span>;
}
