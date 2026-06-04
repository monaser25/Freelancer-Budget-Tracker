'use client';

import { WifiOff } from 'lucide-react';

export const dynamic = 'force-static';

export default function OfflinePage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500">
        <WifiOff size={26} />
      </div>
      <div className="space-y-1">
        <h1 className="text-[16px] font-semibold text-textPrimary">You&rsquo;re offline</h1>
        <p className="max-w-md text-[13px] text-textMuted">
          FlowLedger needs a connection to load the latest clients, subscriptions, and
          transactions. Anything you already opened in this session stays available.
        </p>
      </div>
      <button
        type="button"
        onClick={() => {
          if (typeof window !== 'undefined') window.location.reload();
        }}
        className="rounded-md bg-accent px-4 py-2 text-[13px] font-medium text-white hover:bg-accent-hover"
      >
        Try again
      </button>
    </div>
  );
}
