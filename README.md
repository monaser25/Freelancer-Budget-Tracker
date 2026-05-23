# FlowLedger - Freelancer Budget Tracker

A modern SaaS full-stack application built for freelancers to track their budget, income, expenses, and clients.

## Architecture

This project is structured as a monorepo using npm workspaces:

- `apps/web`: Next.js 14+ (App Router) frontend
- `apps/api`: Express.js & TypeScript backend
- `packages/*`: Shared utilities, types, and UI components

## Stack

- **Frontend**: Next.js, React, Tailwind CSS, Zustand, Recharts
- **Backend**: Node.js, Express, Prisma ORM
- **Database**: PostgreSQL
- **DevOps**: Docker, Docker Compose, GitHub Actions

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
   cd apps/api && npx prisma migrate dev
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

For local development, Supabase auth is used by default. The local dev auth bypass is disabled unless `NEXT_PUBLIC_AUTH_MODE=dev` is set for the web app and `ENABLE_DEV_AUTH=true` is set for the API.
