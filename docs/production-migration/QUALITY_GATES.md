# Quality Gates

## Required Before Any Major Merge

Run from repo root unless noted.

```bash
npm ci
npm test -w apps/web
npm run build -w apps/web
```

If lint is available and working:

```bash
npm run lint -w apps/web
```

## Required Before Production Deploy

```bash
npm ci
npm test -w apps/web
npm run build -w apps/web
npx prisma migrate deploy --schema=apps/web/prisma/schema.prisma
```

Production migration command requires explicit approval.

## Smoke Checks

Unauthenticated:

```text
GET /api/health
```

Authenticated:

```text
GET /api/dashboard/overview
POST /api/transactions/create
PUT /api/clients/update/[id]
```

## UI Quality Checklist

Every touched screen should have:

- Desktop layout.
- Mobile layout.
- Loading state or reasonable app-level loading.
- Empty state.
- Error state.
- Keyboard focus visibility.
- Proper labels for form inputs.
- Safe destructive actions.
- Clear success/failure feedback.
- Dark and light token compatibility.

## Architecture Checklist

- No new duplicated form/table/card patterns if a primitive exists.
- No page file becomes a dumping ground for unrelated utilities.
- No business logic copied from backend into UI unless it is display-only.
- No production behavior depends on HASEELA mock data.
- No new dependency without approval.
- No API contract change without a migration note.

## Security Checklist

- No secrets committed.
- No `.env*` edits by agents.
- Supabase service role remains server-only.
- API routes remain user-scoped.
- Client code uses anon key only.
- Destructive actions require confirmation.

## CI Improvements To Add Later

- Add `npm run build` to GitHub Actions.
- Remove weak `--passWithNoTests` behavior when test config is stable.
- Add Playwright smoke tests.
- Add Lighthouse/PWA audit.
- Add dependency/security audit.

## Portfolio/CV Readiness Checklist

- README has final product name Haseela.
- README has live demo link.
- README has screenshots/GIF.
- README has architecture summary.
- README has technical highlights.
- README has production-hardening section.
- README has limitations and roadmap.
- CI badge is visible.
