'use client';

import { useAuth } from '@/components/AuthProvider';

export default function SettingsPage() {
  const { user, signOut } = useAuth();

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="bg-card border border-border rounded-[var(--radius-lg)] p-5">
        <h1 className="text-[16px] font-semibold text-textPrimary">Account</h1>
        <p className="text-[13px] text-textMuted mt-1">Manage your connected account credentials.</p>
        
        <div className="mt-5 border-t border-border pt-5 flex items-center justify-between gap-4">
          <div>
            <div className="text-[13px] font-medium text-textPrimary">Email Address</div>
            <div className="text-[13px] text-textSecondary mt-0.5">{user?.email || 'Loading...'}</div>
          </div>
          <button 
            onClick={() => signOut()}
            className="px-4 py-2 rounded-md border border-border text-[13px] font-medium text-textSecondary hover:bg-slate-50 transition-colors"
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
            <div className="text-[15px] font-semibold text-textPrimary mt-1">USD ($)</div>
            <div className="text-[11px] text-textMuted mt-1">Default for all reports</div>
          </div>
          <div className="border border-border rounded-md p-4 bg-slate-50/50">
            <div className="text-[12px] text-textSecondary font-medium">Accounting Mode</div>
            <div className="text-[15px] font-semibold text-textPrimary mt-1">Cash basis</div>
            <div className="text-[11px] text-textMuted mt-1">Standard for freelancers</div>
          </div>
        </div>
      </div>
    </div>
  );
}
