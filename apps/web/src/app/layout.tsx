import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppShell } from '@/components/AppShell';
import { themeNoFlashScript } from '@/components/ThemeProvider';

import { Cairo } from 'next/font/google';

const cairo = Cairo({ subsets: ['arabic'], variable: '--font-cairo' });

export const metadata: Metadata = {
  title: 'Haseeela - Freelancer Budget Tracker',
  description: 'A modern SaaS application for freelancers to track their budget, income, expenses, and clients.',
  manifest: '/manifest.json',
  applicationName: 'Haseeela',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Haseeela',
  },
  icons: {
    icon: [
      { url: '/haseeela_icon.png', sizes: '192x192', type: 'image/png' },
      { url: '/haseeela_icon.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/haseeela_icon.png', sizes: '192x192', type: 'image/png' }],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#6D5EFC',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
        {/* Set the theme class before first paint to avoid a light/dark flash. */}
        <script dangerouslySetInnerHTML={{ __html: themeNoFlashScript }} />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var locale = localStorage.getItem('haseeela.locale') || 'en';
                  document.documentElement.lang = locale;
                  document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`${cairo.variable}`}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
