# Phase 1 Build Orders

Run these in order. Do not run them in parallel.

## Build Order 1: Design System Foundation

Mode: Build Mode

Agent name: `build-design-system`

Allowed scope:

- `apps/web/src/app/globals.css`
- `apps/web/tailwind.config.js`
- `apps/web/src/components/ui/*`
- `docs/production-migration/reports/build-design-system.md`

Do not edit:

- `apps/web/src/app/page.tsx`
- `apps/web/src/app/**/page.tsx`
- `apps/web/src/components/AppShell.tsx`
- `apps/web/src/components/Sidebar.tsx`
- `apps/web/src/components/Topbar.tsx`
- `apps/web/src/store/*`
- `apps/web/src/server/*`
- `apps/web/src/app/api/*`
- `apps/web/prisma/*`
- `package.json`
- `package-lock.json`

Prompt:

```text
You are build-design-system working on the Haseela production web migration.

Repository root:
C:\Users\MoNaser\Desktop\Freelancer Budget Tracker 2\Freelancer Budget Tracker

Read these files first:
- docs/production-migration/HASEELA_WEB_MASTER_PLAN.md
- docs/production-migration/AGENT_RULES.md
- docs/production-migration/UI_MAPPING.md
- docs/production-migration/QUALITY_GATES.md
- docs/production-migration/DECISIONS.md
- docs/production-migration/reports/agent-1-design-system.md
- docs/production-migration/reports/lead-review-phase-0.md

Mode: Build Mode

Allowed scope:
- apps/web/src/app/globals.css
- apps/web/tailwind.config.js
- apps/web/src/components/ui/*
- docs/production-migration/reports/build-design-system.md

Task:
Port the Haseela design-system foundation into the production Next.js app without redesigning pages yet.

Requirements:
- Replace the old visual token set with Haseela tokens from HASEELA/Haseela WEB/tokens.css.
- Preserve backward compatibility for existing MVP class names and variable names.
- Add light and dark token definitions.
- Add Inter font target to tokens/Tailwind. Do not edit layout.tsx in this task.
- Extend Tailwind config for semantic colors, radius, shadows, font family, and token-backed names.
- Create typed UI primitives under apps/web/src/components/ui.
- Use lucide-react directly or through a small Icon wrapper.
- Do not add new dependencies.
- Do not modify page files, shell files, API routes, Prisma schema, store files, package files, or env files.

Required components:
- Button.tsx with Button and IconButton exports.
- Badge.tsx with Badge, FilterChip, and DeltaChip exports.
- Card.tsx with Card, StatCard, and SectionHeader exports.
- Avatar.tsx.
- Form.tsx or separate form files with Field, Input, Select, Textarea, Switch, Segmented.
- EmptyState.tsx.
- InlineAlert.tsx.
- Skeleton.tsx.
- index.ts barrel export.

Accessibility requirements:
- Buttons must preserve native button behavior and disabled state.
- Inputs/selects/textareas must forward standard props.
- Field must connect label text clearly; use accessible markup.
- InlineAlert should support status variants.
- EmptyState should be semantic and not rely only on color.

Important constraints:
- Do not implement Modal, Drawer, Menu, ToastProvider, or CommandPalette in this first build unless they are needed by no existing code. We will handle overlays after primitives are reviewed.
- Do not add navigation to future screens.
- Do not use HASEELA mock data.
- Do not introduce self-referential CSS variables.

Validation:
- Run npm run build -w apps/web if possible.
- Run npm test -w apps/web if possible.
- If a command fails, include exact output summary in the report and stop unless the fix is inside your scope.

At the end, write:
docs/production-migration/reports/build-design-system.md

Report format:
# Agent Report

Status:
Scope:
Files changed:
Decisions made:
Risks:
Tests run:
Screenshots/visual notes:
Remaining work:
```

## Build Order 2: Auth UI Polish

Status: Ready.

Run only after `reports/lead-review-build-design-system.md` exists and is approved.

Mode: Build Mode

Agent name: `build-auth-ui`

Allowed scope:

- `apps/web/src/app/login/page.tsx`
- `apps/web/src/app/register/page.tsx`
- `apps/web/src/components/layout/AuthLayout.tsx`
- `apps/web/src/components/auth/*`
- `docs/production-migration/reports/build-auth-ui.md`

Do not edit:

- `apps/web/src/components/AuthProvider.tsx`
- `apps/web/src/components/AppShell.tsx`
- `apps/web/src/components/Sidebar.tsx`
- `apps/web/src/components/Topbar.tsx`
- `apps/web/src/app/globals.css`
- `apps/web/tailwind.config.js`
- `apps/web/src/store/*`
- `apps/web/src/server/*`
- `apps/web/src/app/api/*`
- `apps/web/prisma/*`
- `package.json`
- `package-lock.json`

Prompt:

```text
You are build-auth-ui working on the Haseela production web migration.

Repository root:
C:\Users\MoNaser\Desktop\Freelancer Budget Tracker 2\Freelancer Budget Tracker

Read these files first:
- docs/production-migration/HASEELA_WEB_MASTER_PLAN.md
- docs/production-migration/AGENT_RULES.md
- docs/production-migration/UI_MAPPING.md
- docs/production-migration/QUALITY_GATES.md
- docs/production-migration/DECISIONS.md
- docs/production-migration/reports/agent-2-shell-auth.md
- docs/production-migration/reports/lead-review-build-design-system.md

Mode: Build Mode

Allowed scope:
- apps/web/src/app/login/page.tsx
- apps/web/src/app/register/page.tsx
- apps/web/src/components/layout/AuthLayout.tsx
- apps/web/src/components/auth/*
- docs/production-migration/reports/build-auth-ui.md

Task:
Port the HASEELA premium auth visual direction to the current login and register pages while preserving the existing Supabase Auth behavior exactly.

Requirements:
- Rebrand visible auth copy from FlowLedger to Haseela.
- Create a reusable AuthLayout based on the HASEELA split-screen auth design.
- Create a PasswordInput component with show/hide toggle if useful.
- Use existing UI primitives from apps/web/src/components/ui.
- Preserve existing login/register logic, including:
  - signIn and signUp calls from useAuth.
  - confirmation email notice.
  - resend confirmation flow.
  - email cooldown/rate-limit behavior.
  - redirect query behavior on login.
  - DevAuth support through existing AuthProvider.
- Keep routes as /login and /register only.
- Do not implement forgot password, reset password, verify email, onboarding, profile, billing, or command palette.
- Do not touch AuthProvider, API routes, Prisma, store, shell, or global CSS.
- Do not add dependencies.

Visual expectations:
- Premium split layout on desktop.
- Clean single-column layout on mobile.
- Dark brand panel with Haseela name and calm fintech stats.
- Accessible labels and errors.
- Clear loading/disabled states.

Validation:
- Run npm run build -w apps/web if possible.
- Run npm test -w apps/web if possible.
- If a command fails, include exact output summary in the report and stop unless the fix is inside your scope.

At the end, write:
docs/production-migration/reports/build-auth-ui.md

Report format:
# Agent Report

Status:
Scope:
Files changed:
Decisions made:
Risks:
Tests run:
Screenshots/visual notes:
Remaining work:
```

## Build Order 3: Shell Visual Polish

Status: Ready.

Run only after `reports/lead-review-build-auth-ui.md` exists and is approved.

Mode: Build Mode

Agent name: `build-shell-ui`

Allowed scope:

- `apps/web/src/components/AppShell.tsx`
- `apps/web/src/components/Sidebar.tsx`
- `apps/web/src/components/Topbar.tsx`
- `apps/web/src/components/layout/*`
- `docs/production-migration/reports/build-shell-ui.md`

Do not edit:

- `apps/web/src/app/**/page.tsx`
- `apps/web/src/app/globals.css`
- `apps/web/tailwind.config.js`
- `apps/web/src/components/AuthProvider.tsx`
- `apps/web/src/components/FinancialBootstrap.tsx`
- `apps/web/src/components/auth/*`
- `apps/web/src/store/*`
- `apps/web/src/server/*`
- `apps/web/src/app/api/*`
- `apps/web/prisma/*`
- `package.json`
- `package-lock.json`

Prompt:

```text
You are build-shell-ui working on the Haseela production web migration.

Repository root:
C:\Users\MoNaser\Desktop\Freelancer Budget Tracker 2\Freelancer Budget Tracker

Read these files first:
- docs/production-migration/HASEELA_WEB_MASTER_PLAN.md
- docs/production-migration/AGENT_RULES.md
- docs/production-migration/UI_MAPPING.md
- docs/production-migration/QUALITY_GATES.md
- docs/production-migration/DECISIONS.md
- docs/production-migration/reports/agent-2-shell-auth.md
- docs/production-migration/reports/lead-review-build-auth-ui.md

Mode: Build Mode

Allowed scope:
- apps/web/src/components/AppShell.tsx
- apps/web/src/components/Sidebar.tsx
- apps/web/src/components/Topbar.tsx
- apps/web/src/components/layout/*
- docs/production-migration/reports/build-shell-ui.md

Task:
Port the HASEELA premium app shell visual direction to the current authenticated web shell while preserving existing routing, auth gate, data bootstrap, and transaction creation behavior.

Requirements:
- Rebrand visible shell copy from FlowLedger to Haseela.
- Keep existing authenticated route structure and Next.js routes.
- Keep `AuthProvider`, `AuthGate`, and `FinancialBootstrap` behavior intact.
- Keep current mobile navigation behavior unless you can improve visuals without changing routes or data flow.
- Use existing UI primitives from `apps/web/src/components/ui` where practical.
- Improve Sidebar and Topbar visual quality using Haseela tokens.
- Preserve the current New Transaction modal behavior in `Topbar`; visual polish is allowed, but do not remove or break create transaction logic.
- Do not add future navigation links for invoices, reports, notifications, profile, billing, onboarding, or command palette.
- Do not implement CommandPalette in this build order.
- Do not add dependencies.

Allowed feature-level polish:
- Sidebar Haseela branding.
- Better active states and hover states.
- Dark/light-token-compatible colors.
- Cleaner topbar spacing and button styles.
- Optional sidebar collapse only if implemented without breaking layout and without affecting mobile navigation.

Validation:
- Run npm run build -w apps/web if possible.
- Run npm test -w apps/web if possible.
- If a command fails, include exact output summary in the report and stop unless the fix is inside your scope.

At the end, write:
docs/production-migration/reports/build-shell-ui.md

Report format:
# Agent Report

Status:
Scope:
Files changed:
Decisions made:
Risks:
Tests run:
Screenshots/visual notes:
Remaining work:
```

## Build Order 4: Dashboard And Analytics

Status: Ready.

Run only after `reports/lead-review-build-shell-ui.md` exists and is approved.

Mode: Build Mode

Agent name: `build-dashboard-analytics`

Allowed scope:

- `apps/web/src/app/page.tsx`
- `apps/web/src/app/analytics/page.tsx`
- `apps/web/src/components/charts/*`
- `docs/production-migration/reports/build-dashboard-analytics.md`

Do not edit:

- `apps/web/src/components/AppShell.tsx`
- `apps/web/src/components/Sidebar.tsx`
- `apps/web/src/components/Topbar.tsx`
- `apps/web/src/app/globals.css`
- `apps/web/tailwind.config.js`
- `apps/web/src/components/ui/*`
- `apps/web/src/components/auth/*`
- `apps/web/src/components/layout/*`
- `apps/web/src/store/*`
- `apps/web/src/server/*`
- `apps/web/src/app/api/*`
- `apps/web/prisma/*`
- `package.json`
- `package-lock.json`

Prompt:

```text
You are build-dashboard-analytics working on the Haseela production web migration.

Repository root:
C:\Users\MoNaser\Desktop\Freelancer Budget Tracker 2\Freelancer Budget Tracker

Read these files first:
- docs/production-migration/HASEELA_WEB_MASTER_PLAN.md
- docs/production-migration/AGENT_RULES.md
- docs/production-migration/UI_MAPPING.md
- docs/production-migration/QUALITY_GATES.md
- docs/production-migration/DECISIONS.md
- docs/production-migration/reports/agent-3-screen-mapping.md
- docs/production-migration/reports/lead-review-build-shell-ui.md

Mode: Build Mode

Allowed scope:
- apps/web/src/app/page.tsx
- apps/web/src/app/analytics/page.tsx
- apps/web/src/components/charts/*
- docs/production-migration/reports/build-dashboard-analytics.md

Task:
Port the HASEELA premium visual direction to the existing Dashboard and Analytics pages while preserving current production data flows and backend-supported behavior.

Requirements:
- Use only real data from the existing store/hooks. Do not use HASEELA mock data.
- Preserve existing dashboard transaction creation behavior for Add Revenue and Log Expense.
- Preserve existing links/routes. Do not add invoices, reports, notifications, pricing, billing, profile, onboarding, or future-feature links.
- Use existing UI primitives from `apps/web/src/components/ui` where practical.
- Keep Recharts if it is already used. You may create lightweight chart wrapper components under `components/charts/*` only if useful.
- Improve Dashboard stats, quick actions, revenue/expenses chart, recent transactions, clients overview, and subscriptions panel using Haseela tokens.
- Improve Analytics visual hierarchy and chart styling using Haseela tokens.
- Add or improve empty/error states where appropriate.
- Keep financial calculations semantically equivalent to current behavior.
- Do not edit store, API routes, Prisma, shell, auth, global CSS, Tailwind, package files, or env files.
- Do not add dependencies.

Validation:
- Run npm run build -w apps/web if possible.
- Run npm test -w apps/web if possible.
- If a command fails, include exact output summary in the report and stop unless the fix is inside your scope.

At the end, write:
docs/production-migration/reports/build-dashboard-analytics.md

Report format:
# Agent Report

Status:
Scope:
Files changed:
Decisions made:
Risks:
Tests run:
Screenshots/visual notes:
Remaining work:
```
