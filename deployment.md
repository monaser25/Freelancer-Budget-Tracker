# FlowLedger Vercel-Only Deployment Guide

FlowLedger now deploys as one Vercel Hobby project:

- **Web and API**: Vercel Next.js app in `apps/web` (all API routes live in `apps/web/src/app/api`)
- **Auth and database**: Supabase Auth and Supabase Postgres
- **Not used**: Railway, Render, Stripe, billing, paid plans

## 1. Supabase Setup

1. Create a Supabase project.
2. Keep Supabase Auth enabled.
3. Use Supabase Postgres as the Prisma database.
4. Copy both database URLs:
   - `DATABASE_URL`: Supabase pooled connection string for Vercel serverless runtime with Prisma PgBouncer parameters.
   - `DIRECT_URL`: Supabase direct database connection string for Prisma migrations, without `pgbouncer=true`.
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
DATABASE_URL="postgres://postgres.[YOUR_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true&connection_limit=1"
DIRECT_URL="postgres://postgres.[YOUR_REF]:[PASSWORD]@db.[YOUR_REF].supabase.co:5432/postgres?sslmode=require"
SUPABASE_URL="https://[YOUR_REF].supabase.co"
SUPABASE_SERVICE_ROLE_KEY="eyJhbG..."
NEXT_PUBLIC_SUPABASE_URL="https://[YOUR_REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbG..."
NEXT_PUBLIC_API_URL=""
```

`NEXT_PUBLIC_API_URL` should stay empty. Empty means the browser calls same-origin paths such as `/api/dashboard/overview` against the Next.js Route Handlers.

For Prisma on Vercel with the Supabase pooler, `DATABASE_URL` must include `sslmode=require`, `pgbouncer=true`, and `connection_limit=1`. Missing these pooler parameters can cause production 500s with `PostgresError code 42P05: prepared statement already exists`.

Keep `DIRECT_URL` pointed at the direct Supabase database host (`db.[YOUR_REF].supabase.co:5432`) for migrations. Do not add `pgbouncer=true` to `DIRECT_URL`.

## 5. Prisma Schema And Migrations

Canonical Prisma path:

```text
apps/web/prisma/schema.prisma
apps/web/prisma/migrations/
```

The schema uses:

- `DATABASE_URL` for pooled runtime queries from Vercel Route Handlers. It must include `?sslmode=require&pgbouncer=true&connection_limit=1`.
- `DIRECT_URL` for safe Prisma migration commands. It must use the direct database host and must not include `pgbouncer=true`.

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

All API routes live in Next.js Route Handlers under `apps/web/src/app/api`.

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

## 7. Production Redeploy And Verification

After changing `DATABASE_URL` in Vercel, redeploy the production deployment so the serverless functions pick up the new pooler settings.

Verify these routes after redeploy:

```text
GET /api/health
GET /api/dashboard/overview
PUT /api/clients/update/[id]
POST /api/transactions/create
```

`/api/dashboard/overview`, client update, and transaction create require an authenticated Supabase bearer token. A successful verification should confirm:

- `/api/health` returns `{ "status": "ok" }` without a 500.
- `/api/dashboard/overview` returns `clients`, `subscriptions`, and `transactions` arrays.
- Client update persists the edited client fields and does not return a Prisma prepared statement error.
- Manual transaction create returns `201` and persists the transaction.

## 8. Local Development

Use the Next.js web app for frontend and API handlers:

```bash
npm run dev -w apps/web
```

Same-origin Next.js routes serve `/api/*`; leave `NEXT_PUBLIC_API_URL` empty.

## 9. Security Checklist

- Supabase bearer tokens are verified server-side in Next Route Handlers.
- Every data read/write is scoped by authenticated `userId`.
- Linked client/subscription transactions cannot be edited or deleted directly through transaction endpoints.
- `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, and `DIRECT_URL` are server-only Vercel variables.
- Currency preference remains frontend-only local storage behavior.
- No Stripe, billing, paid plans, Railway, or Render deployment is required.
