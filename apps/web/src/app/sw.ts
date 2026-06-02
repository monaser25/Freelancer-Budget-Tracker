/// <reference lib="webworker" />
/// <reference types="@serwist/next/typings" />

import { defaultCache } from '@serwist/next/worker';
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist';
import { CacheFirst, NetworkFirst, NetworkOnly, Serwist, StaleWhileRevalidate } from 'serwist';

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
    // Mutations under /api must never be served from cache.
    {
      matcher: ({ request, url }) =>
        url.pathname.startsWith('/api/') && request.method !== 'GET',
      handler: new NetworkOnly(),
    },
    // Read-only API calls: prefer network, fall back to cached snapshot if
    // the user is briefly offline. Short TTL so a stale list never lingers.
    {
      matcher: ({ request, url }) =>
        url.pathname.startsWith('/api/') && request.method === 'GET',
      handler: new NetworkFirst({
        cacheName: 'api-get',
        networkTimeoutSeconds: 6,
        plugins: [
          {
            cacheWillUpdate: async ({ response }) =>
              response && response.status === 200 ? response : null,
          },
        ],
      }),
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
