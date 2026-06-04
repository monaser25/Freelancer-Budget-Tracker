/// <reference lib="webworker" />
/// <reference types="@serwist/next/typings" />

import { defaultCache } from '@serwist/next/worker';
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist';
import { CacheFirst, NetworkOnly, Serwist, StaleWhileRevalidate } from 'serwist';

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  // Offline fallback for navigation requests that can't reach the network.
  fallbacks: {
    entries: [
      {
        url: '/offline',
        matcher: ({ request }) => request.destination === 'document',
      },
    ],
  },
  runtimeCaching: [
    // Auth pages — never serve a cached login/register; always hit the network
    // so Supabase callbacks and error states behave correctly.
    {
      matcher: ({ url }) => url.pathname.startsWith('/login') || url.pathname.startsWith('/register'),
      handler: new NetworkOnly(),
    },
    // API routes are same-origin Next handlers with user-scoped data. Keep them
    // network-only so deployments never serve stale authenticated responses.
    {
      matcher: ({ url }) =>
        url.pathname.startsWith('/api/'),
      handler: new NetworkOnly(),
    },
    // Hashed Next.js build assets are immutable — safe to serve cache-first.
    {
      matcher: ({ url }) => url.pathname.startsWith('/_next/static/'),
      handler: new CacheFirst({ cacheName: 'next-static' }),
    },
    // Manifest + icons + other public assets.
    {
      matcher: ({ url }) =>
        url.pathname === '/manifest.json' || url.pathname.startsWith('/icons/'),
      handler: new StaleWhileRevalidate({ cacheName: 'public-assets' }),
    },
    // Everything else (fonts, navigation HTML, etc.) — keep Serwist defaults.
    ...defaultCache,
  ],
});

serwist.addEventListeners();
