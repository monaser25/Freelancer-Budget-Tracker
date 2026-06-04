'use client';

import dynamic from 'next/dynamic';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { Topbar } from '@/components/Topbar';
import { FinancialBootstrap } from '@/components/FinancialBootstrap';
import { AuthProvider, useAuth } from '@/components/AuthProvider';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ToastProvider } from '@/components/ui/Toast';
import { useUiStore } from '@/store/uiStore';

// Routes rendered without the app shell (full-bleed).
const bareRoutes = new Set([
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify',
  '/onboarding',
  '/offline',
]);

const CommandPalette = dynamic(
  () => import('@/components/CommandPalette').then((mod) => mod.CommandPalette),
  { ssr: false },
);

const EntityModals = dynamic(
  () => import('@/components/modals/EntityModals').then((mod) => mod.EntityModals),
  { ssr: false },
);

function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { mobileNavOpen, setMobileNavOpen, togglePalette, paletteOpen, newModal } = useUiStore();
  const isBareRoute = bareRoutes.has(pathname);

  useEffect(() => {
    if (isLoading) return;
    if (!user && !isBareRoute) {
      const current = `${pathname}${typeof window !== 'undefined' ? window.location.search : ''}`;
      router.replace(`/login?redirect=${encodeURIComponent(current)}`);
      return;
    }
    if (user && (pathname === '/login' || pathname === '/register')) {
      router.replace('/');
    }
  }, [isBareRoute, isLoading, pathname, router, user]);

  // Global ⌘K / Ctrl+K to toggle the command palette.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        togglePalette();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [togglePalette]);

  // Close the mobile nav whenever the route changes.
  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname, setMobileNavOpen]);

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background text-[13px] text-text-muted">
        Loading Haseela…
      </div>
    );
  }

  if (isBareRoute) return <>{children}</>;

  if (!user) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background text-[13px] text-text-muted">
        Redirecting to login…
      </div>
    );
  }

  return (
    <>
      <FinancialBootstrap />
      <div className="flex h-screen overflow-hidden bg-background text-foreground w-full">
        {/* Desktop sidebar */}
        <div className="hidden lg:flex">
          <Sidebar />
        </div>

        {/* Mobile slide-over */}
        {mobileNavOpen && (
          <div
            className="lg:hidden fixed inset-0 z-[160] bg-black/50 anim-fade"
            onMouseDown={() => setMobileNavOpen(false)}
          >
            <div
              className="h-full w-[260px]"
              style={{ animation: 'fl-slide-right var(--dur-base) var(--ease-out)' }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <Sidebar mobile onClose={() => setMobileNavOpen(false)} />
            </div>
          </div>
        )}

        {/* Main column */}
        <div className="flex-1 flex flex-col min-w-0 h-full">
          <Topbar />
          <main className="flex-1 overflow-y-auto bg-background">
            <div className="mx-auto w-full max-w-[var(--content-max)] px-4 py-5 sm:px-5 md:px-8 md:py-8 pb-24 md:pb-12">
              {children}
            </div>
          </main>
        </div>
      </div>

      {paletteOpen && <CommandPalette />}
      {newModal && <EntityModals />}
    </>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <AuthGate>{children}</AuthGate>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
