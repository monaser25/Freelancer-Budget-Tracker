# Agent Board

This file tracks agent assignments. Update statuses only when coordinating work.

## Status Values

- `not-started`
- `planning`
- `ready-for-build`
- `building`
- `needs-review`
- `approved`
- `blocked`

## Current Agents

| Agent | Mode | Status | Scope | Report |
|---|---|---:|---|---|
| Agent 1 | Plan | approved | Design system and UI primitives | `reports/agent-1-design-system.md` |
| Agent 2 | Plan | approved | App shell and auth UI | `reports/agent-2-shell-auth.md` |
| Agent 3 | Plan | approved | MVP screens to HASEELA mapping | `reports/agent-3-screen-mapping.md` |
| Build Design System | Build | approved | Tokens and first UI primitives | `reports/build-design-system.md` |
| Build Auth UI | Build | approved | Login/register premium UI | `reports/build-auth-ui.md` |
| Build Shell UI | Build | approved | App shell visual polish | `reports/build-shell-ui.md` |
| Build Dashboard Analytics | Build | ready-for-build | Dashboard and analytics pages | `reports/build-dashboard-analytics.md` |
| Agent 4 | Build later | not-started | Dashboard and analytics | `reports/agent-4-dashboard-analytics.md` |
| Agent 5 | Build later | not-started | Transactions and forms | `reports/agent-5-transactions.md` |
| Agent 6 | Build later | not-started | Clients, subscriptions, archive, settings | `reports/agent-6-money-sections.md` |
| Agent QA | Review | not-started | QA, tests, regression, production gaps | `reports/agent-qa.md` |

## Recommended Execution

### Step 1: Parallel Plan Mode

Completed. Agent 1, Agent 2, and Agent 3 ran in Plan Mode.

They must not edit production code.

They may write only their report files.

### Step 2: Lead Review

Completed. See `reports/lead-review-phase-0.md`.

### Step 3: Sequential Foundation Build

Run foundation work in sequence:

1. Design tokens and first UI primitives.
2. Lead review.
3. Auth UI.
4. Lead review.
5. App shell.
6. Lead review.

### Step 4: Parallel Core Screens

After the foundation is approved, split page work in parallel only if file ownership does not overlap.

### Step 5: QA Review

Agent QA reviews all changes and runs checks.

## Active Order

Only run `Build Dashboard Analytics` now.

Do not run other page build agents until `reports/build-dashboard-analytics.md` is reviewed and approved.

## Lock Rules

Only one agent may edit these areas at a time:

- `apps/web/src/app/globals.css`
- `apps/web/src/components/ui/*`
- `apps/web/src/components/layout/*`
- `apps/web/src/components/AppShell.tsx`
- `apps/web/src/components/Sidebar.tsx`
- `apps/web/src/components/Topbar.tsx`
- `apps/web/src/store/*`
- `apps/web/prisma/*`
