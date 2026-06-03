'use client';

import { useAuth } from '@/components/AuthProvider';
import { getCurrencyLabel, makeCurrencyFormatter, supportedCurrencies } from '@/lib/currency';
import { useFinancialStore } from '@/store/useFinancialStore';
import { CurrencyCode } from '@/types/finance';
import { Badge, Button, Card, Field, Icon, InlineAlert, SectionHeader, Select, StatCard } from '@/components/ui';

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const { currency, setCurrency, overview } = useFinancialStore();
  const money = makeCurrencyFormatter(currency, { maximumFractionDigits: 0 });

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-10">
      <div>
        <h1 className="t-h1">Settings</h1>
        <p className="t-body mt-1 text-text-muted">Manage account access and workspace display preferences</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Currency" value={currency} icon="WalletCards" />
        <StatCard label="Accounting mode" value="Cash" icon="Receipt" />
        <StatCard label="Total revenue" value={money.format(overview.totalRevenue)} tone="positive" icon="TrendingUp" />
      </div>

      <Card pad={20}>
        <SectionHeader title="Account" sub="Manage your connected account credentials." />
        
        <div className="mt-5 border-t border-border pt-5 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex min-w-0 items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-accent-tint text-accent flex items-center justify-center shrink-0">
              <Icon name="User" size={18} />
            </div>
            <div className="min-w-0">
              <div className="t-body-m text-text">Email address</div>
              <div className="text-sm text-text-secondary mt-0.5 break-all">{user?.email || 'Loading...'}</div>
              <div className="mt-2"><Badge tone="positive">Authenticated</Badge></div>
            </div>
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={() => signOut()}
            className="w-full sm:w-auto"
          >
            Log out
          </Button>
        </div>
      </Card>

      <Card pad={20}>
        <SectionHeader title="Workspace preferences" sub="These settings apply to your entire financial workspace." />
        
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="border border-border rounded-lg p-4 bg-surface-hover/50">
            <Field label="Currency" hint={`Formats displays as ${getCurrencyLabel(currency)}. Amount conversion is not implemented yet.`}>
              <Select
                value={currency}
                onChange={(event) => setCurrency(event.target.value as CurrencyCode)}
              >
                {supportedCurrencies.map((item) => (
                  <option key={item.code} value={item.code}>{item.label}</option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="border border-border rounded-lg p-4 bg-surface-hover/50">
            <div className="t-body-m text-text-secondary">Accounting mode</div>
            <div className="t-h3 text-text mt-1">Cash basis</div>
            <div className="text-sm text-text-muted mt-1">Standard for freelancers</div>
          </div>
        </div>

        <InlineAlert tone="info" className="mt-5">
          Changing currency updates symbols and formatting only. Stored transaction amounts are not converted.
        </InlineAlert>
      </Card>
    </div>
  );
}
