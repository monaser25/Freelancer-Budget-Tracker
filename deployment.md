# FlowLedger Vercel-Only Deployment Guide

FlowLedger now deploys as one Vercel Hobby project:

- **Web and API**: Vercel Next.js app in `apps/web`
- **Auth and database**: Supabase Auth and Supabase Postgres
- **Deprecated fallback only**: `apps/api` Express app remains in the repo but is not required for production deployment
- **Not used**: Railway, Render, Stripe, billing, paid plans

## 1. Supabase Setup

1. Create a Supabase project.
2. Keep Supabase Auth enabled.
3. Use Supabase Postgres as the Prisma database.
4. Copy both database URLs:
   - `DATABASE_URL`: Supabase pooled connection string for Vercel serverless runtime.
   - `DIRECT_URL`: Supabase direct database connection string for Prisma migrations.
5. Never expose `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, or `DIRECT_URL` to browser code.

## 2. Supabase Auth Redirect URLs

Configure these in Supabase Dashboard under **Authentication -> URL Configuration**:

- Local development: `http://localhost:3000/**`
- Production: `https://your-flowledger-app.vercel.app/**`

If email confirmation is enabled, users must confirm their email before login. The app already supports the confirmation redirect and resend flow.

## 3. Vercel Project Settings

Create one Vercel project for `apps/web`.

- **Framework Preset**: Next.js
- **Root Directory**: `apps/web`
- **Install Command**: `npm install`
- **Build Command**: `npm run build`

The web build runs `prisma generate --schema=prisma/schema.prisma` before `next build`.

## 4. Vercel Environment Variables

Set these on the Vercel project:

```env
DATABASE_URL="postgres://postgres.[YOUR_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgres://postgres.[YOUR_REF]:[PASSWORD]@db.[YOUR_REF].supabase.co:5432/postgres"
SUPABASE_URL="https://[YOUR_REF].supabase.co"
SUPABASE_SERVICE_ROLE_KEY="eyJhbG..."
NEXT_PUBLIC_SUPABASE_URL="https://[YOUR_REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbG..."
NEXT_PUBLIC_API_URL=""
```

`NEXT_PUBLIC_API_URL` should stay empty for Vercel-only deployment. Empty means the browser calls same-origin paths such as `/api/dashboard/overview`.

Only set `NEXT_PUBLIC_API_URL` if you deliberately want to call an external API fallback.

## 5. Prisma Schema And Migrations

Canonical Prisma path:

```text
apps/web/prisma/schema.prisma
apps/web/prisma/migrations/
```

The schema uses:

- `DATABASE_URL` for pooled runtime queries from Vercel Route Handlers.
- `DIRECT_URL` for safe Prisma migration commands.

Do not use `prisma db push` for production. Use migration history only.

Before the first production deploy, apply migrations to Supabase from the repo root:

```bash
npx prisma migrate deploy --schema=apps/web/prisma/schema.prisma
```

Or from `apps/web`:

```bash
npx prisma migrate deploy
```

## 6. API Runtime

The Express routes have been moved to Next.js Route Handlers under `apps/web/src/app/api`.

All handlers that touch Prisma or auth use:

```ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
```

Primary health check:

```text
GET /api/health
```

Expected response:

```json
{ "status": "ok", "time": "..." }
```

## 7. Local Development

Use the same web app for frontend and API handlers:

```bash
npm run dev -w apps/web
```

The legacy Express API can still be started separately as a fallback:

```bash
npm run dev -w apps/api
```

If you use the fallback Express API locally, set `NEXT_PUBLIC_API_URL="http://localhost:4000"`. Otherwise leave it empty for same-origin Next routes.

## 8. Security Checklist

- Supabase bearer tokens are verified server-side in Next Route Handlers.
- Every data read/write is scoped by authenticated `userId`.
- Linked client/subscription transactions cannot be edited or deleted directly through transaction endpoints.
- `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, and `DIRECT_URL` are server-only Vercel variables.
- Currency preference remains frontend-only local storage behavior.
- No Stripe, billing, paid plans, Railway, or Render deployment is required.
