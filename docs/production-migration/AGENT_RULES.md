# Agent Rules

These rules apply to every external agent working on Haseela.

## Operating Modes

### Plan Mode

Use Plan Mode when the task is research, analysis, mapping, or proposal writing.

Plan Mode agents must not edit files except their own report if explicitly allowed.

### Build Mode

Use Build Mode only for a specific implementation task with an approved scope.

Build Mode agents must edit only the allowed files/directories listed in their prompt.

## Core Rules

- Do not make architecture decisions outside the assigned task.
- Do not touch files outside the allowed scope.
- Do not rename routes, database fields, env vars, or API contracts unless explicitly requested.
- Keep Supabase Auth, Prisma, and existing API behavior intact unless the task explicitly says otherwise.
- Do not use mock data in production screens.
- Do not expose secrets.
- Do not edit `.env*` files.
- Do not run destructive Git commands.
- Do not run production database migrations unless explicitly approved.
- Do not change Vercel/Supabase production settings unless explicitly approved.
- Keep changes small and reviewable.
- Prefer reusable components over duplicated UI.
- Preserve keyboard focus, labels, and aria attributes where needed.
- Support desktop and mobile responsive layouts.
- Support dark and light tokens for all touched UI.

## File Ownership Rules

One agent owns one area at a time.

Do not allow two agents to edit the same file in parallel.

High-conflict files:

- `apps/web/src/app/globals.css`
- `apps/web/tailwind.config.js`
- `apps/web/src/components/AppShell.tsx`
- `apps/web/src/components/Sidebar.tsx`
- `apps/web/src/components/Topbar.tsx`
- `apps/web/src/store/financialStore.ts`
- `apps/web/src/types/finance.ts`
- `apps/web/prisma/schema.prisma`
- `package.json`
- `package-lock.json`

These files require sequence, not parallel work.

## Report Requirement

Every agent must write a report:

```text
docs/production-migration/reports/<agent-name>.md
```

Report format:

```md
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

## Testing Rules

Run the narrowest useful checks for the task.

Common commands:

```bash
npm test -w apps/web
npm run build -w apps/web
npm run lint -w apps/web
```

If a command cannot run because of environment constraints, record it in the report.

## Git Rules

- Work on feature branches only.
- Do not commit unless explicitly asked.
- Do not amend commits.
- Do not force push.
- Do not reset or checkout away other people's work.
- Before starting, inspect current changed files.
- After finishing, report changed files.

## Database Rules

Prisma schema work is serial only.

Allowed only in an explicitly approved backend/migration task:

- `apps/web/prisma/schema.prisma`
- `apps/web/prisma/migrations/*`
- production migration commands

Any schema change must include:

- migration file
- local validation plan
- production rollout notes
- rollback/risk notes

## UI Rules

- Use HASEELA prototype as reference, not as direct source.
- Convert prototype UI into typed React components.
- Keep production routes backed by real data.
- Do not add navigation to future screens unless the screen is production-backed or intentionally marked as disabled/coming soon.

## Communication Rules

- If blocked, stop and report the blocker.
- If unexpected unrelated changes exist, do not revert them.
- If a task needs a new dependency, ask first and justify it.
- If a design decision is ambiguous, choose the smallest reversible option and record it.
