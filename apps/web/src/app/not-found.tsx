import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center gap-4 px-6">
      <div className="t-display text-text-muted tnum" style={{ fontSize: 64, lineHeight: 1 }}>404</div>
      <div className="space-y-1.5">
        <h1 className="t-h2">Page not found</h1>
        <p className="max-w-md t-body text-text-secondary">
          The page you&rsquo;re looking for doesn&rsquo;t exist or may have moved.
        </p>
      </div>
      <Link
        href="/"
        className="inline-flex items-center gap-2 h-9 px-3.5 rounded-md bg-accent text-accent-fg t-body-m hover:bg-accent-hover transition-colors focus-ring"
      >
        <Icon name="arrowLeft" size={16} /> Back to dashboard
      </Link>
    </div>
  );
}
