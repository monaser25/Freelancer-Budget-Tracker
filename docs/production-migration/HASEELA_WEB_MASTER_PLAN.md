# Haseela Web Production Migration Master Plan

## Mission

Turn the existing freelancer budget tracker MVP into a production-grade web product named **Haseela**.

The target is not a visual reskin only. The migration must improve UI quality, code organization, maintainability, data handling, error states, scalability, and portfolio/CV presentation.

## Product Name

Final brand name: **Haseela**

Legacy/internal names that may still exist in code or docs:

- FlowLedger
- Freelancer Budget Tracker

Rename carefully and incrementally. Do not break env names, database data, or deployment settings without an explicit task.

## Current Architecture Summary

```text
apps/web
  Next.js 14 App Router
  React + TypeScript
  Tailwind CSS
  Next API Route Handlers under src/app/api
  Prisma ORM
  Supabase Auth
  Supabase Postgres
  Vercel deployment

HASEELA/Haseela WEB
  Claude-generated premium web UI prototype
  Reference only, not production source

HASEELA/Haseela MOBILE
  Claude-generated mobile design canvas
  Reference only, mobile work deferred
```

## Migration Strategy

Use the HASEELA prototype as a visual and UX reference, but implement production-grade code inside `apps/web`.

Do not copy prototype files directly into the production app unless explicitly instructed. Convert them into typed React components, real routes, shared primitives, and API-backed screens.

## Release Scope: Web V1

V1 focuses on replacing the MVP UI for already-supported backend features.

Included:

- Rebrand visible product copy to Haseela where safe.
- Premium design tokens.
- Dark and light mode foundation.
- UI primitives.
- App shell.
- Auth UI polish for login/register.
- Dashboard.
- Transactions.
- Clients.
- Subscriptions.
- Analytics.
- Archive.
- Settings.
- Offline screen.
- Loading, empty, and error states.
- Responsive desktop/mobile web layout.
- CI/build/test cleanup.
- Vercel preview verification.

Deferred to Web V2 unless explicitly approved:

- Invoices.
- Invoice PDF export.
- Reports/export.
- Notifications.
- Profile management.
- Onboarding wizard.
- Forgot/reset password screens beyond current Supabase capability.
- Pricing/billing/payment provider integration.
- Mobile app.

## Non-Negotiable Product Rules

- No mock data in production routes.
- No fake backend features in production navigation.
- No production Supabase schema changes without an approved migration task.
- No direct edits to Vercel/Supabase production settings without explicit approval.
- Preserve existing authenticated user data flows.
- Preserve existing API behavior unless a migration task explicitly changes it.
- Keep changes small enough to review.

## Target Source Structure

This is the desired direction. Do not restructure the entire project in one task.

```text
apps/web/src
  app
    (auth)
    (dashboard)
    api
    globals.css
    layout.tsx
  components
    layout
    ui
    charts
    forms
    feedback
  features
    auth
    dashboard
    transactions
    clients
    subscriptions
    analytics
    archive
    settings
  lib
    api
    auth
    currency
    dates
    errors
    env
  server
    auth
    db
    services
    validation
  store
  types
```

Potential shared packages, only when useful:

```text
packages/ui
packages/shared
packages/config
```

Do not move code into packages until there is a concrete benefit and the task asks for it.

## Phase Plan

### Phase 0: Coordination And Guardrails

- Create coordination docs.
- Set agent rules.
- Decide Git workflow.
- Map HASEELA UI to production routes.
- No product code changes.

### Phase 1: Design System Foundation

- Port tokens from HASEELA into production CSS/Tailwind.
- Add reusable UI primitives.
- Support dark/light mode tokens.
- Do not redesign screens yet except as needed to validate primitives.

### Phase 2: App Shell And Auth

- Premium sidebar/topbar.
- Better navigation structure.
- Command palette only if it can be cleanly implemented.
- Auth UI polish while preserving Supabase behavior.

### Phase 3: Core Screens

- Dashboard and Analytics.
- Transactions and transaction forms.
- Clients, Subscriptions, Archive, Settings.
- Use production API/store data only.

### Phase 4: Architecture Cleanup

- Extract duplicated forms/tables/cards.
- Improve store boundaries.
- Improve server service boundaries where needed.
- Add route-level loading/error/not-found screens.

### Phase 5: QA And Production Hardening

- Run lint/test/build.
- Add missing tests for critical flows.
- Fix stale scripts/docs.
- Verify Vercel preview.
- Verify Supabase auth/database flows.

### Phase 6: New Product Features

- Invoices.
- Reports/export.
- Notifications.
- Profile.
- Onboarding.
- Billing/pricing if approved.

## Definition Of Done For Any Implementation Task

- Scope matched exactly.
- No unrelated files changed.
- Existing behavior preserved.
- UI works in desktop and mobile viewport.
- Loading, empty, and error states considered.
- Accessibility basics preserved.
- TypeScript passes.
- Relevant tests/build commands run or documented if skipped.
- Agent report written under `docs/production-migration/reports/`.
