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

3. Run PostgreSQL via Docker Compose:
   ```bash
   docker-compose up db -d
   ```

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

## Recurring Transactions

FlowLedger currently creates and maintains one linked transaction for each active client payment or subscription at the configured billing date. The backend does not yet run a monthly rollover worker that generates future billing-cycle transactions forever.

Recurring rollover is intentionally deferred. When implemented, add a scheduled backend job or protected route that finds due active retainers/subscriptions, creates one transaction per `userId + sourceType + sourceId + date`, advances `nextBillingDate`, and relies on the database unique constraint to prevent duplicates.

## Currency Preferences

Currency is currently a per-user frontend preference stored in local storage under the authenticated user id. It controls display formatting only through `Intl.NumberFormat`; FlowLedger does not convert historical transaction amounts between currencies yet.
