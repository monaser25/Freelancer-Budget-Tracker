# FlowLedger - Freelancer Budget Tracker

A modern SaaS full-stack application built for freelancers to track their budget, income, expenses, and clients.

## Architecture

This project is structured as a monorepo using npm workspaces:

- `apps/web`: Next.js 14+ App Router app — UI **and** API route handlers under `src/app/api`.
- `packages/*`: Shared utilities, types, and UI components.

## Stack

- **Frontend**: Next.js, React, Tailwind CSS, Zustand, Recharts
- **Backend**: Next.js Route Handlers (Node runtime) + Prisma ORM
- **Database**: PostgreSQL (Supabase) + Supabase Auth
- **PWA**: Installable on mobile via Serwist-generated service worker + manifest
- **DevOps**: GitHub Actions, Vercel

## Setup Instructions

1. Install dependencies:
   ```bash
   npm install
   ```

2. Setup environment variables:
    ```bash
    cp .env.example .env
    ```

   The web app and API route handlers are both served by Next.js. Keep `NEXT_PUBLIC_API_URL` empty for local and Vercel runs so the browser calls same-origin `/api/*` routes.

3. Run PostgreSQL via Docker Compose if you want a local database:
    ```bash
    docker-compose up db -d
    ```

   For local Postgres, set both database URLs to the local database before running migrations:

   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:5432/flowledger"
   DIRECT_URL="postgresql://postgres:password@localhost:5432/flowledger"
   ```

   If you prefer using the live Supabase database locally, keep the Supabase pooler/direct URLs from `.env.example` instead.

4. Run Prisma Migrations:
    ```bash
    cd apps/web && npx prisma migrate dev
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

## Supabase Auth Settings

Email/password auth requires Supabase email confirmation.

Required Supabase dashboard settings:

- Authentication -> Providers -> Email -> Confirm email = enabled
- Authentication -> URL Configuration -> Site URL = `http://localhost:3000`
- Authentication -> URL Configuration -> Redirect URLs include `http://localhost:3000/**`

Registration flow:

- User registers with email/password.
- Supabase sends the confirmation email.
- User cannot log in until the email is confirmed.
- Confirmation links redirect back to `http://localhost:3000/login?confirmed=1`.
- After confirmation, the user logs in normally from the app.

For local development, Supabase auth is used by default. The local dev auth bypass is disabled unless `NEXT_PUBLIC_AUTH_MODE=dev` is set for the web app and `ENABLE_DEV_AUTH=true` is set on the server.

Dev auth only works in `next dev`. Local production mode (`next build` then `next start`) uses `NODE_ENV=production`, so use real Supabase auth variables there.

## Production-Mode Local Check

After setting production-ready env vars, run:

```bash
npm run build -w apps/web
npm run start -w apps/web -- -p 3100
```

Then verify direct visits and refreshes for `/`, `/login`, `/clients`, `/transactions`, `/analytics`, `/reports`, `/invoices`, and `/settings`.

If Vercel CLI created `.env.production.local` with blank required variables, fill them or remove the blank entries before the production-mode check. Blank values can override working `.env.local` values.

## Recurring Transactions

FlowLedger currently creates and maintains one linked transaction for each active client payment or subscription at the configured billing date. The backend does not yet run a monthly rollover worker that generates future billing-cycle transactions forever.

Recurring rollover is intentionally deferred. When implemented, add a scheduled backend job or protected route that finds due active retainers/subscriptions, creates one transaction per `userId + sourceType + sourceId + date`, advances `nextBillingDate`, and relies on the database unique constraint to prevent duplicates.

## Currency Preferences

Currency is currently a per-user frontend preference stored in local storage under the authenticated user id. It controls display formatting only through `Intl.NumberFormat`; FlowLedger does not convert historical transaction amounts between currencies yet.
