# Phase 0 Verification Notes

## Source Of Truth

The current Phase 0 source of truth in the frontend is the normalized Zustand financial state in `apps/web/src/store/financialStore.ts`.

`setInitialData` normalizes API/local-cache data, removes orphaned linked transactions, dedupes linked transactions, attaches missing transaction ids, and reconciles one linked transaction per active client/subscription.

## Snapshot Loading

Snapshot loading happens in `apps/web/src/components/FinancialBootstrap.tsx`.

The load order is:
1. `loadFinancialSnapshot()` from `apps/web/src/services/financialApi.ts`, which calls `GET /api/dashboard/overview`.
2. If the API fails, read `flowledger-financial-state` from `localStorage`.
3. If local cache is missing or invalid, load `mockData` and show an offline warning.

All loaded data is passed through `setInitialData`, so old API/cache snapshots with stale values, orphaned links, or duplicate linked transactions are normalized before use.

## Snapshot Saving

Snapshot saving happens in `persistSnapshot` inside `apps/web/src/store/financialStore.ts`.

Every store mutation calls `finalizeMutation`, which runs `processPendingBillings` as a reconciliation step and then saves the same normalized snapshot to:
1. `localStorage` key `flowledger-financial-state`.
2. `POST /api/dashboard/snapshot` via `saveFinancialSnapshot()`.

If API saving fails, the app keeps local data and sets the store error to `Changes are saved locally. API sync is unavailable.`

## Duplicate Handling

Linked transactions are keyed by `sourceType + sourceId`, with `clientId` and `subscriptionId` used as fallbacks.

`dedupeLinkedTransactions` keeps the first linked transaction for each source and drops the rest. Reconciliation then updates the kept transaction from the source client/subscription, so stale amounts, names, and dates are corrected.

If a linked transaction is missing for an active source record, reconciliation recreates exactly one linked transaction with a stable id.

## Phase 1 Replacement

Snapshot sync is temporary. Phase 1 should replace it with authenticated server-owned mutations:
1. Add auth middleware and tenant-scoped user/workspace context.
2. Replace `POST /api/dashboard/snapshot` with resource endpoints or server actions for client, subscription, and transaction mutations.
3. Move source-link reconciliation to backend services and database constraints.
4. Remove localStorage as a source of truth and keep it only as optional offline cache if offline mode is intentionally supported.

## DB-Backed Runtime QA

Supabase project `tpzydgcvlbndedsejqxb` was used as PostgreSQL only. Prisma migrations were applied with `prisma migrate deploy`.

The browser QA script `scripts/phase0-browser-qa.mjs` runs against the local API/web stack and verifies:
1. One-time client create/edit/delete syncs exactly one linked income transaction.
2. Overview and Analytics update after client changes.
3. Browser refresh reloads persisted client data from Supabase/Postgres, not localStorage.
4. Subscription create/edit/delete syncs exactly one linked expense transaction without duplicates.
5. Retainer create/edit/delete syncs exactly one linked income transaction.
6. Manual transaction create/edit/delete remains independent from client/subscription sources.
7. Browser refresh reloads persisted manual transaction data from Supabase/Postgres.

Runtime issues found and fixed during DB-backed QA:
1. Concurrent dev-user creation could race under overlapping snapshot saves.
2. Duplicate transaction IDs in old snapshots could fail server-side createMany.
3. Nullable `billingDay` values from Postgres were incorrectly coerced to `0` during validation.
4. Overlapping snapshot writes could deadlock in Postgres.
5. Loading API data was immediately resaving it, allowing older page loads to overwrite newer mutations.
