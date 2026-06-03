'use client';

import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';

export const dynamic = 'force-static';

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center bg-background text-text">
      <div className="w-16 h-16 rounded-full bg-warning-tint text-warning flex items-center justify-center">
        <Icon name="wifiOff" size={28} />
      </div>
      <div className="space-y-1.5">
        <h1 className="t-h2">You&rsquo;re offline</h1>
        <p className="max-w-md t-body text-text-secondary">
          Haseela needs a connection to load your latest clients, subscriptions, and transactions.
          Anything already open in this session stays available.
        </p>
      </div>
      <Button icon="refreshCcw" onClick={() => typeof window !== 'undefined' && window.location.reload()}>
        Try again
      </Button>
    </div>
  );
}
