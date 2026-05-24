'use client';

import { useAuth } from '@/components/AuthProvider';
import { getCurrencyLabel, makeCurrencyFormatter, supportedCurrencies } from '@/lib/currency';
import { useFinancialStore } from '@/store/useFinancialStore';
import { CurrencyCode } from '@/types/finance';

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const { currency, setCurrency, overview } = useFinancialStore();
  const money = makeCurrencyFormatter(currency, { maximumFractionDigits: 0 });

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="bg-card border border-border rounded-[var(--radius-lg)] p-5">
        <h1 className="text-[16px] font-semibold text-textPrimary">Account</h1>
        <p className="text-[13px] text-textMuted mt-1">Manage your connected account credentials.</p>
        
        <div className="mt-5 border-t border-border pt-5 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="min-w-0">
            <div className="text-[13px] font-medium text-textPrimary">Email Address</div>
            <div className="text-[13px] text-textSecondary mt-0.5 break-all">{user?.email || 'Loading...'}</div>
          </div>
          <button 
            onClick={() => signOut()}
            className="w-full px-4 py-2 rounded-md border border-border text-[13px] font-medium text-textSecondary hover:bg-slate-50 transition-colors sm:w-auto"
          >
            Log Out
          </button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-[var(--radius-lg)] p-5">
        <h2 className="text-[16px] font-semibold text-textPrimary">Workspace Preferences</h2>
        <p className="text-[13px] text-textMuted mt-1">
          These settings apply to your entire financial workspace.
        </p>
        
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="border border-border rounded-md p-4 bg-slate-50/50">
            <div className="text-[12px] text-textSecondary font-medium">Currency</div>
            <select
              value={currency}
              onChange={(event) => setCurrency(event.target.value as CurrencyCode)}
              className="mt-2 w-full px-3 py-2 border border-border rounded-md text-[13px] outline-none focus:border-accent bg-background"
            >
              {supportedCurrencies.map((item) => (
                <option key={item.code} value={item.code}>{item.label}</option>
              ))}
            </select>
            <div className="text-[11px] text-textMuted mt-2">Formats displays as {getCurrencyLabel(currency)}. Amount conversion is not implemented yet.</div>
          </div>
          <div className="border border-border rounded-md p-4 bg-slate-50/50">
            <div className="text-[12px] text-textSecondary font-medium">Accounting Mode</div>
            <div className="text-[15px] font-semibold text-textPrimary mt-1">Cash basis</div>
            <div className="text-[11px] text-textMuted mt-1">Standard for freelancers</div>
          </div>
        </div>

        <div className="mt-5 border-t border-border pt-5">
          <div className="text-[12px] text-textSecondary font-medium">Current Summary</div>
          <div className="text-[15px] font-semibold text-textPrimary mt-1">Total revenue: {money.format(overview.totalRevenue)}</div>
          <div className="text-[11px] text-textMuted mt-1">Changing currency updates symbols and formatting only, not stored transaction amounts.</div>
        </div>
      </div>
    </div>
  );
}
