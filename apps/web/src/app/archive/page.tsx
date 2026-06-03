'use client';

import { useMemo, useState } from 'react';
import { useFinancialStore } from '@/store/useFinancialStore';
import { makeCurrencyFormatter } from '@/lib/currency';
import { Avatar, Badge, Button, Card, EmptyState, Icon, InlineAlert, SectionHeader, StatCard } from '@/components/ui';

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
  const archivedTransactionCount = archivedClients.reduce((sum, client) => sum + clientTransactionCount(client.id), 0)
    + archivedSubscriptions.reduce((sum, sub) => sum + subscriptionTransactionCount(sub.id), 0);

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-10">
      <div>
        <h1 className="t-h1">Archive</h1>
        <p className="t-body mt-1 text-text-muted">Paused clients and subscriptions with preserved historical records</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Archived clients" value={archivedClients.length} icon="Users" />
        <StatCard label="Archived tools" value={archivedSubscriptions.length} icon="CreditCard" />
        <StatCard label="Historical records" value={archivedTransactionCount} icon="Archive" />
      </div>

      <InlineAlert tone="info">
        Archived items do not generate future billing. Historical transactions remain in your ledger.
      </InlineAlert>

      {error && (
        <InlineAlert tone="negative">{error}</InlineAlert>
      )}

      {isEmpty ? (
        <Card pad={0}>
          <EmptyState icon="Archive" title="No archived items" body="Clients and subscriptions you remove will appear here, ready to restore later." />
        </Card>
      ) : (
        <>
          {archivedClients.length > 0 && (
            <Card pad={0} className="overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-border">
                <SectionHeader title="Archived clients" sub={`${archivedClients.length} client${archivedClients.length === 1 ? '' : 's'}`} className="mb-0" />
              </div>
              <div className="divide-y divide-border">
                {archivedClients.map((client) => (
                  <div key={client.id} className="p-4 flex flex-col gap-3 hover:bg-surface-hover transition-colors sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar name={client.name} size={40} color="--viz-6" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="t-body-m text-text">{client.name}</span>
                          <Badge>{client.paymentType === 'retainer' ? 'Retainer' : 'One-time'}</Badge>
                        </div>
                        <div className="text-sm text-text-muted mt-0.5">
                          {client.paymentType === 'retainer' ? `${money.format(client.revenue)}/mo` : money.format(client.revenue)}
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
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={restoringId === client.id}
                      onClick={() => handleRestoreClient(client.id)}
                      loading={restoringId === client.id}
                      icon="RotateCcw"
                      className="sm:w-auto"
                    >
                      {restoringId === client.id ? 'Restoring...' : 'Restore'}
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {archivedSubscriptions.length > 0 && (
            <Card pad={0} className="overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-border">
                <SectionHeader title="Archived subscriptions" sub={`${archivedSubscriptions.length} subscription${archivedSubscriptions.length === 1 ? '' : 's'}`} className="mb-0" />
              </div>
              <div className="divide-y divide-border">
                {archivedSubscriptions.map((sub) => (
                  <div key={sub.id} className="p-4 flex flex-col gap-3 hover:bg-surface-hover transition-colors sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-surface-hover text-text-secondary flex items-center justify-center shrink-0">
                        <Icon name="CreditCard" size={17} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="t-body-m text-text">{sub.name}</span>
                          <Badge>{(sub.billingCycle || sub.cycle).toLowerCase()}</Badge>
                        </div>
                        <div className="text-sm text-text-muted mt-0.5">
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
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={restoringId === sub.id}
                      onClick={() => handleRestoreSubscription(sub.id)}
                      loading={restoringId === sub.id}
                      icon="RotateCcw"
                      className="sm:w-auto"
                    >
                      {restoringId === sub.id ? 'Restoring...' : 'Restore'}
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
