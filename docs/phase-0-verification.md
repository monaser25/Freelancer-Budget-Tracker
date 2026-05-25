# Phase 0 Verification Notes

## Source Of Truth

The Phase 0 financial source of truth is the Prisma-backed API in `apps/web/src/app/api`.

Clients, subscriptions, and manual transactions are mutated through resource endpoints. Overview and frontend bootstrap load the canonical snapshot from `GET /api/dashboard/overview`.

Linked client/subscription transactions are reconciled from their source records in `apps/web/src/server/linked-transactions.ts` and mirrored for local fallback caches in `apps/web/src/services/financialSync.ts`.

## Snapshot Loading

Snapshot loading happens in `apps/web/src/components/FinancialBootstrap.tsx`.

The load order is:

1. `loadFinancialSnapshot()` from `apps/web/src/services/financialApi.ts`, which calls `GET /api/dashboard/overview`.
2. `GET /api/dashboard/overview` authenticates the user and runs linked-transaction reconciliation before returning clients, subscriptions, and transactions.
3. If the API fails during initial load, `FinancialBootstrap` reads `flowledger-financial-state:[userId]` from `localStorage`.
4. If local cache is missing or invalid, the store initializes to empty arrays and shows an API connection error.

All API and cached data passes through `setInitialData()` in `apps/web/src/store/financialStore.ts`, which calls `reconcileFinancialSnapshot()` before data reaches Overview, Analytics, Clients, Subscriptions, or Transactions pages.

## Snapshot Saving

Snapshot saving is local-cache only in Phase 0.

Saving happens in `persistLocalSnapshot()` inside `apps/web/src/store/financialStore.ts` after initial loads and successful local mutation updates.

The old `POST /api/dashboard/snapshot` endpoint is intentionally deprecated in `apps/web/src/app/api/dashboard/snapshot/route.ts` and returns `410`. The app no longer writes whole snapshots back to the server.

Server persistence happens through individual CRUD endpoints:

1. `POST /api/clients/create`, `PUT /api/clients/update/[id]`, `DELETE /api/clients/delete/[id]`.
2. `POST /api/subscriptions/create`, `PUT /api/subscriptions/update/[id]`, `DELETE /api/subscriptions/delete/[id]`.
3. `POST /api/transactions/create`, `PUT /api/transactions/update/[id]`, `DELETE /api/transactions/delete/[id]` for manual transactions only.

## API Failure Behavior

If initial API loading fails, the app uses the user-scoped local cache when available and sets this store error: `Using locally cached data. API sync will resume when the backend is available.`

If a create/update/delete API call fails, the local store is not mutated and the page surfaces the API error.

If a create/update/delete API call succeeds but the follow-up refresh fails, the successful mutation remains visible in the local store. The local store runs the same linked-transaction reconciliation before caching so source records, linked transactions, Overview, and Analytics remain internally consistent until API refresh works again.

## Older Or Duplicate Local Cache

Older local cache is only used when the API is unavailable. It is not allowed to overwrite API data.

When cached data is loaded, `reconcileFinancialSnapshot()`:

1. Normalizes legacy `client-payment` transactions to `client`.
2. Treats `sourceType + sourceId` as the linked transaction identity, with `clientId` and `subscriptionId` as fallbacks.
3. Keeps one linked transaction per client/subscription source and drops duplicate linked transactions.
4. Updates stale linked transaction amount, date, notes, type, status, category, `isAuto`, and source fields from the source client/subscription.
5. Removes orphaned linked transactions whose client/subscription no longer exists.
6. Recreates one missing linked transaction for an active client/subscription source.
7. Keeps manual transactions independent by clearing source/client/subscription links from manual cached transactions.

## Duplicate Prevention

The app-level invariant is one linked transaction per active `sourceType + sourceId`.

Server reconciliation in `apps/web/src/server/linked-transactions.ts` enforces this before overview reads and after client/subscription create or update. If multiple linked rows exist from old data, it keeps the preferred `transactionId` row when possible, updates it from the source record, and deletes the other linked rows.

Client and subscription delete endpoints use `deleteMany` with source and foreign-key matching, so all linked duplicates are removed with the source record.

## Data Model Agreement

Prisma schema: `apps/web/prisma/schema.prisma`.

Frontend types: `apps/web/src/types/finance.ts`.

Agreement points:

1. Client fields: `name`, `email`, `company`, `revenue`, `clientType`, `status`, `paymentType`, `paymentDate`, `billingDay`, `nextBillingDate`, `recorded`, and `transactionId` exist in both layers.
2. Subscription fields: `cycle` uses `MONTHLY | QUARTERLY | YEARLY`; `nextBillingDate` is required in both layers.
3. Transaction fields: `sourceType`, `sourceId`, `clientId`, and `subscriptionId` exist in both layers. The frontend normalizes legacy `client-payment` to `client`.
4. Category codes are stored as `categoryId` strings. Linked client transactions use `CLIENT`; linked subscription transactions use `TOOLS`.
5. `isAuto` and `isEdited` exist in Prisma and frontend transaction types. Linked source-generated transactions are marked `isAuto: true`; direct manual transactions are forced to `sourceType: manual` and `isAuto: false`.

## Phase 1 Replacement

Phase 1 should keep the resource-endpoint model and replace temporary dev/local-cache behavior with authenticated tenant ownership:

1. Add authenticated user/workspace scoping to all reads and writes.
2. Keep linked transaction reconciliation on the backend and add database-level constraints where practical after cleaning old data.
3. Remove localStorage as a fallback source of truth; keep it only as an optional read-through cache if offline mode is intentionally supported.
4. Keep Overview and Analytics derived from the canonical transactions returned by the API.
