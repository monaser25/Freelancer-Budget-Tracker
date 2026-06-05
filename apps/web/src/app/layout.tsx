import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppShell } from '@/components/AppShell';
import { themeNoFlashScript } from '@/components/ThemeProvider';

import { Inter, Cairo } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
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
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
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
      <body className={`${inter.variable} ${cairo.variable}`}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
