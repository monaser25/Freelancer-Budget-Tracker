# FlowLedger Free SaaS Deployment Guide

FlowLedger is a multi-tenant, free SaaS application built on Next.js, Express, Prisma, and Supabase.

## Recommended Architecture
- **Web/Frontend**: [Vercel](https://vercel.com) (Best for Next.js out of the box)
- **API/Backend**: [Railway](https://railway.app) or [Render](https://render.com) (Great for Docker/Node background services)
- **Database & Auth**: [Supabase](https://supabase.com) PostgreSQL & Supabase Auth

## 1. Supabase Setup
1. Create a new Supabase project.
2. Under Database Settings, locate your IPv4 Connection Pooling URL (`aws-0-[region].pooler.supabase.com`).
3. Keep Supabase Auth enabled.
4. **Important**: Never expose your `service_role` key to the frontend.

### Supabase Auth Redirect URLs
Configure these in Supabase Dashboard under **Authentication -> URL Configuration**:
- **Local development**: `http://localhost:3000/**`
- **Production**: add the deployed Vercel domain later, for example `https://your-flowledger-app.vercel.app/**`

For local development and free SaaS QA, email confirmation can be disabled in Supabase Dashboard under **Authentication -> Providers -> Email -> Confirm email**. If confirmation stays enabled, users must confirm the email link before login; the app shows a clear message and supports resending confirmation emails.

## 2. API Service Deployment (Railway/Render)
The Express API serves as the gatekeeper for all data mutations and enforces multi-tenant data isolation.

### Project Settings
- **Root Directory**: `/` (Monorepo root)
- **Build Command**: `npm install && npx prisma generate --schema=apps/api/prisma/schema.prisma && npm run build -w apps/api`
- **Start Command**: `npx prisma migrate deploy --schema=apps/api/prisma/schema.prisma && npm run start -w apps/api`

### Environment Variables (`apps/api`)
```env
# Required: Supabase Database URL (Use connection pooling URL)
DATABASE_URL="postgres://postgres.[YOUR_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"

# Required: For direct database actions (Prisma migrations)
DIRECT_URL="postgres://postgres.[YOUR_REF]:[PASSWORD]@db.[YOUR_REF].supabase.co:5432/postgres"

# Required: Supabase Auth Verification
SUPABASE_URL="https://[YOUR_REF].supabase.co"
SUPABASE_SERVICE_ROLE_KEY="eyJhbG..." # Securely kept on the server

# Security / CORS
FRONTEND_URL="https://your-frontend-domain.com" # Important: NO trailing slash
PORT=4000
NODE_ENV="production"
```

### Health Check
Once deployed, verify the backend is running by pinging `GET https://your-api-domain.com/health`. It should return:
```json
{ "status": "ok", "time": "..." }
```

## 3. Web Service Deployment (Vercel)
The frontend is a static/SSR hybrid Next.js app.

### Project Settings
- **Framework Preset**: Next.js
- **Root Directory**: `apps/web`
- **Build Command**: `npm run build` (Vercel will detect Next.js automatically)

### Environment Variables (`apps/web`)
Set these environment variables on Vercel:
```env
NEXT_PUBLIC_SUPABASE_URL="https://[YOUR_REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbG..."
NEXT_PUBLIC_API_URL="https://your-api-domain.com" # Important: NO trailing slash
```
*Security Note: NEVER expose the `service_role` key or `DATABASE_URL` in the frontend environment.*

## Security Hardening Checklist
- [x] **Tokens**: Bearer tokens are passed securely to the Express backend. No tokens are logged.
- [x] **Tenancy**: `req.user.id` is explicitly passed in all DB writes/reads. Cross-user leaks are prevented natively by the architecture.
- [x] **CORS**: Ensure `FRONTEND_URL` is set exactly without a trailing slash in production to restrict API access.
- [x] **Rate Limiting**: Enabled on the backend to prevent abuse (`100` requests per 15 minutes by default).
- [x] **No Billing**: This is a Free SaaS. Stripe/Billing environments are intentionally omitted.
