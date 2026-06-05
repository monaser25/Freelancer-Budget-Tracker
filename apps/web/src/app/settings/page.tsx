'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useTheme, type ThemeMode } from '@/components/ThemeProvider';
import { useFinancialStore } from '@/store/financialStore';
import { getCurrencyLabel, supportedCurrencies } from '@/lib/currency';
import { CurrencyCode } from '@/types/finance';
import { loadPreferencesAPI, updatePreferencesAPI, type UserPreferences } from '@/services/financialApi';
import { Button } from '@/components/ui/Button';
import { Card, SectionHeader } from '@/components/ui/Card';
import { Field, Select, Switch, Segmented } from '@/components/ui/Form';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { useToast } from '@/components/ui/Toast';

export default function SettingsPage() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const { currency, setCurrency } = useFinancialStore();
  const { toast } = useToast();
  const [prefs, setPrefs] = useState<UserPreferences | null>(null);

  useEffect(() => {
    loadPreferencesAPI().then(setPrefs).catch(() => undefined);
  }, []);

  const patch = async (updates: Partial<UserPreferences>) => {
    setPrefs((p) => (p ? { ...p, ...updates } : p));
    try {
      const next = await updatePreferencesAPI(updates);
      setPrefs(next);
    } catch {
      toast('Could not save preference', 'error');
    }
  };

  const onCurrency = (code: CurrencyCode) => {
    setCurrency(code); // immediate display + localStorage cache
    patch({ currency: code });
  };

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div>
        <h1 className="t-h1">Settings</h1>
        <p className="t-body text-text-muted mt-1">Account & workspace</p>
      </div>

      {/* Account */}
      <Card pad={20}>
        <SectionHeader title="Account" sub="Your sign-in identity." />
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-accent-tint text-accent flex items-center justify-center shrink-0">
              <Icon name="user" size={18} />
            </div>
            <div className="min-w-0">
              <div className="t-body-m break-all">{user?.email || '—'}</div>
              <Badge tone="positive" className="mt-1">Authenticated</Badge>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" icon="user" onClick={() => router.push('/profile')}>Profile</Button>
            <Button variant="ghost" onClick={() => signOut().then(() => router.replace('/login'))}>Log out</Button>
          </div>
        </div>
      </Card>

      {/* Workspace */}
      <Card pad={20}>
        <SectionHeader title="Workspace" sub="Display preferences for your whole workspace." />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Currency" hint={`Formats amounts as ${getCurrencyLabel(currency)}. Formatting only - no conversion.`}>
            <Select value={currency} onChange={(e) => onCurrency(e.target.value as CurrencyCode)}>
              {supportedCurrencies.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
            </Select>
          </Field>
          <Field label="Language" hint="Change your interface language.">
            <LanguageToggle variant="segmented" />
          </Field>
          <Field label="Accounting mode" hint="Standard for freelancers.">
            <Select value="cash" disabled>
              <option value="cash">Cash basis</option>
            </Select>
          </Field>
        </div>
      </Card>

      {/* Appearance */}
      <Card pad={20}>
        <SectionHeader title="Appearance" sub="Choose how Haseeela looks." />
        <Segmented
          value={theme}
          onChange={(v) => setTheme(v as ThemeMode)}
          options={[{ value: 'system', label: 'System' }, { value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }]}
        />
      </Card>

      {/* Notifications */}
      <Card pad={20}>
        <SectionHeader title="Notifications" sub="Choose which reminders Haseeela generates." />
        <div className="flex flex-col divide-y divide-border">
          <ToggleRow
            label="Billing reminders"
            hint="Upcoming subscription & retainer payments."
            checked={prefs?.notifyBillingReminders ?? true}
            disabled={!prefs}
            onChange={(v) => patch({ notifyBillingReminders: v })}
          />
          <ToggleRow
            label="Invoice due alerts"
            hint="When a sent invoice becomes overdue."
            checked={prefs?.notifyInvoiceDue ?? true}
            disabled={!prefs}
            onChange={(v) => patch({ notifyInvoiceDue: v })}
          />
          <ToggleRow
            label="Weekly summary"
            hint="A weekly recap of your finances."
            checked={prefs?.notifyWeeklySummary ?? false}
            disabled={!prefs}
            onChange={(v) => patch({ notifyWeeklySummary: v })}
          />
        </div>
      </Card>
    </div>
  );
}

function ToggleRow({ label, hint, checked, disabled, onChange }: { label: string; hint: string; checked: boolean; disabled?: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5">
      <div className="min-w-0">
        <div className="t-body-m">{label}</div>
        <div className="t-small text-text-muted">{hint}</div>
      </div>
      <Switch checked={checked} disabled={disabled} onChange={onChange} />
    </div>
  );
}
