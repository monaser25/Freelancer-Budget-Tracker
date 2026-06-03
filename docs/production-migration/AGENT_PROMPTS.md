# Agent Prompts

Use these prompts for external agents. Replace `<AGENT_NAME>` where needed.

## Base Prompt For Every Agent

```text
You are working on the Haseela production web migration.

Repository root:
C:\Users\MoNaser\Desktop\Freelancer Budget Tracker 2\Freelancer Budget Tracker

Read these files before doing anything:
- docs/production-migration/HASEELA_WEB_MASTER_PLAN.md
- docs/production-migration/AGENT_RULES.md
- docs/production-migration/UI_MAPPING.md
- docs/production-migration/QUALITY_GATES.md
- docs/production-migration/DECISIONS.md

Rules:
- Do not make architecture decisions outside the assigned task.
- Do not touch files outside your allowed scope.
- Do not rename routes, database fields, env vars, or API contracts unless explicitly requested.
- Keep existing Supabase Auth, Prisma, and API behavior intact.
- Do not use mock data in production screens unless the task explicitly says reference-only.
- Do not edit .env files.
- Do not run production database migrations.
- Keep changes small and reviewable.
- Preserve accessibility and responsive behavior.
- Support dark and light mode tokens for touched UI.
- At the end, write your report to docs/production-migration/reports/<AGENT_NAME>.md.

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

## Initial Plan Agents

Run these three agents in parallel in Plan Mode.

They must not edit production code. They may write only their report files.

### Agent 1: Design System Analysis

```text
Use the Base Prompt.

Agent name: agent-1-design-system
Mode: Plan Mode

Task:
Analyze apps/web and HASEELA/Haseela WEB for the design system migration only.

Do not edit production files.
You may write only:
docs/production-migration/reports/agent-1-design-system.md

Return in the report:
- Which tokens should replace current globals.css variables.
- Which UI primitives should be built first.
- Proposed component list.
- Risky files.
- Exact implementation order.
- Any dependency concerns.

Focus on:
- apps/web/src/app/globals.css
- apps/web/tailwind.config.js
- apps/web/src/components/ui
- HASEELA/Haseela WEB/tokens.css
- HASEELA/Haseela WEB/components.jsx
```

### Agent 2: Shell And Auth Analysis

```text
Use the Base Prompt.

Agent name: agent-2-shell-auth
Mode: Plan Mode

Task:
Analyze the app shell and auth migration.

Do not edit production files.
You may write only:
docs/production-migration/reports/agent-2-shell-auth.md

Return in the report:
- Current shell/auth structure.
- HASEELA shell/auth features worth porting.
- What should be done first.
- What should be deferred.
- File ownership plan.
- Risks.

Focus on:
- apps/web/src/components/AppShell.tsx
- apps/web/src/components/Sidebar.tsx
- apps/web/src/components/Topbar.tsx
- apps/web/src/components/AuthProvider.tsx
- apps/web/src/app/login/page.tsx
- apps/web/src/app/register/page.tsx
- HASEELA/Haseela WEB/shell.jsx
- HASEELA/Haseela WEB/screen-auth.jsx
```

### Agent 3: Screen Mapping Analysis

```text
Use the Base Prompt.

Agent name: agent-3-screen-mapping
Mode: Plan Mode

Task:
Analyze current MVP pages versus HASEELA premium screens.

Do not edit production files.
You may write only:
docs/production-migration/reports/agent-3-screen-mapping.md

Create a mapping with:
- Current route.
- HASEELA reference file.
- Backend support status.
- UI components needed.
- Data dependencies.
- Suggested implementation priority.
- High-conflict files.

Focus on:
- apps/web/src/app/page.tsx
- apps/web/src/app/transactions/page.tsx
- apps/web/src/app/clients/page.tsx
- apps/web/src/app/subscriptions/page.tsx
- apps/web/src/app/analytics/page.tsx
- apps/web/src/app/archive/page.tsx
- apps/web/src/app/settings/page.tsx
- HASEELA/Haseela WEB/screen-*.jsx
```

## Future Build Agents

Do not run these until the tech lead approves after reviewing the three plan reports.

### Build Agent: Design System Foundation

```text
Use the Base Prompt.

Agent name: build-design-system
Mode: Build Mode

Allowed scope:
- apps/web/src/app/globals.css
- apps/web/tailwind.config.js
- apps/web/src/components/ui/*
- docs/production-migration/reports/build-design-system.md

Task:
Port the Haseela design tokens and create the first reusable UI primitives.

Do not modify pages or API routes.
Do not add new dependencies unless approved.

Required primitives:
- Button
- IconButton
- Card
- Badge
- Field
- Input
- Select
- Textarea
- Switch
- EmptyState
- InlineAlert

Acceptance criteria:
- Existing pages still compile.
- Tokens support light and dark.
- Components are typed and accessible enough for production use.
- Report tests run.
```

### Build Agent: Shell And Auth

```text
Use the Base Prompt.

Agent name: build-shell-auth
Mode: Build Mode

Allowed scope:
- apps/web/src/components/AppShell.tsx
- apps/web/src/components/Sidebar.tsx
- apps/web/src/components/Topbar.tsx
- apps/web/src/components/layout/*
- apps/web/src/app/login/page.tsx
- apps/web/src/app/register/page.tsx
- docs/production-migration/reports/build-shell-auth.md

Task:
Port the Haseela premium shell and auth visual direction while preserving Supabase auth behavior.

Do not change API routes.
Do not add future navigation links unless disabled or approved.
```
