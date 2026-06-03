'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { Topbar } from '@/components/Topbar';
import { FinancialBootstrap } from '@/components/FinancialBootstrap';
import { AuthProvider, useAuth } from '@/components/AuthProvider';
import { useFinancialStore } from '@/store/financialStore';

const authRoutes = new Set(['/login', '/register']);

function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const isFinancialInitialized = useFinancialStore((state) => state.isInitialized);
  const isAuthRoute = authRoutes.has(pathname);

  useEffect(() => {
    if (isLoading) return;

    if (!user && !isAuthRoute) {
      const current = `${pathname}${typeof window !== 'undefined' ? window.location.search : ''}`;
      router.replace(`/login?redirect=${encodeURIComponent(current)}`);
      return;
    }

    if (user && isAuthRoute) {
      router.replace('/');
    }
  }, [isAuthRoute, isLoading, pathname, router, user]);

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background text-[13px] text-text-muted">
        Loading Haseela...
      </div>
    );
  }

  if (isAuthRoute) {
    return <>{children}</>;
  }

  if (!user) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background text-[13px] text-text-muted">
        Redirecting to login...
      </div>
    );
  }

  return (
    <>
      <FinancialBootstrap />
      <Sidebar />
      <main className="w-full md:ml-[var(--sidebar-w)] flex-1 flex flex-col min-h-screen">
        {isFinancialInitialized ? (
          <>
            <Topbar />
            <div className="px-4 py-5 pb-24 sm:px-5 md:p-8 flex-1 overflow-auto">
              {children}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-[13px] text-text-muted">
            Loading your financial workspace...
          </div>
        )}
      </main>
    </>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuthGate>{children}</AuthGate>
    </AuthProvider>
  );
}
