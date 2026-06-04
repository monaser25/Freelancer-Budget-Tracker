# Supabase Auth — Required Configuration & Incident Notes

This document covers the Supabase Auth dashboard settings the app depends on and
explains the root causes behind the three auth incidents we investigated. The
code fixes alone are **not** enough — the dashboard settings below must also be
applied for the password-reset and email flows to be correct and reliable.

Project ref: `tpzydgcvlbndedsejqxb` · Production URL:
`https://freelancer-budget-tracker-web.vercel.app`

---

## 1. Site URL & Redirect URLs (fixes the "reset logs into wrong account" routing)

**Dashboard → Authentication → URL Configuration**

- **Site URL**: `https://freelancer-budget-tracker-web.vercel.app`
  - This is the fallback Supabase uses when an email link's `redirect_to` is
    **not** in the allow-list. It must point at the app origin (no `/verify`
    suffix).
- **Redirect URLs** (allow-list) — every path the app sends as `emailRedirectTo`
  / `redirectTo` must be listed here, otherwise Supabase silently ignores it and
  falls back to the Site URL:
  ```
  https://freelancer-budget-tracker-web.vercel.app/verify
  https://freelancer-budget-tracker-web.vercel.app/reset-password
  http://localhost:3000/verify
  http://localhost:3000/reset-password
  http://localhost:3001/verify
  http://localhost:3001/reset-password
  ```

> **Why this matters (root cause of Issue 1):** the production auth logs showed
> recovery requests redirecting to **`/verify`** (the email-confirmation page),
> which immediately established a session and routed the user into the app —
> "logged in without entering a new password." That happens when
> `/reset-password` is **missing from the Redirect URLs allow-list**, so the
> recovery email's `redirect_to=…/reset-password` is dropped and Supabase falls
> back to the Site URL. Adding `/reset-password` to the allow-list makes recovery
> links land on the correct page.
>
> The code now also defends against this independently: `/verify` detects a
> `type=recovery` token and forwards it to `/reset-password` instead of logging
> the user in, and `/reset-password` clears any existing session and refuses to
> fall back to a stale one.

---

## 2. Email Templates (recovery must point at the reset page)

**Dashboard → Authentication → Email Templates → "Reset Password"**

Confirm the template uses the standard confirmation URL and does **not**
hard-code a path to `/verify` or the dashboard. The default body is correct:

```html
<h2>Reset Password</h2>
<p>Follow this link to reset the password for your user:</p>
<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
```

`{{ .ConfirmationURL }}` resolves to
`{SUPABASE_URL}/auth/v1/verify?token=…&type=recovery&redirect_to={redirectTo}`.
With `/reset-password` allow-listed (section 1), `redirectTo` is honored.

Check the **"Confirm signup"** template likewise points to `{{ .ConfirmationURL }}`
(it redirects to `/verify`, which is correct for signup).

> Keep signup (`/verify`) and recovery (`/reset-password`) on **distinct** redirect
> targets. They must never share a landing page, or a recovery token can be
> consumed by the confirm-and-login path.

---

## 3. Custom SMTP (fixes Issues 2 & 3 — "no email arrives" and rate limits)

The production logs show all auth mail is sent from
**`noreply@mail.app.supabase.io`** — i.e. the project is on Supabase's
**built-in email service**. That service is intended for development only and:

- has a **very low, project-wide hourly send cap** (default ~2–4/hour). This is
  exactly the `429 over_email_send_rate_limit` error seen in the logs — and why
  it persisted **across different Gmail addresses** (the cap is per-project, not
  per-recipient) and was **not reset by deleting users** (Issue 3).
- has **poor deliverability** to Gmail/Outlook (often dropped or spam-filed),
  which is why the "confirmation email sent" message appeared but **no email
  arrived** (Issue 2). The recent DNS changes are a red herring here: the
  built-in sender uses Supabase's own domain, so your domain's DNS does not
  affect it.

**Fix: configure custom SMTP.** Dashboard → **Authentication → Emails → SMTP
Settings → Enable Custom SMTP**, then fill in a transactional provider.

### Recommended: Resend (or SendGrid / Postmark / Amazon SES)

1. Create an account with the provider and **verify your sending domain**
   (e.g. `mail.haseeela.app`). The provider gives you DNS records to add.
2. In your DNS, add the records the provider lists. At minimum:
   - **SPF**: a `TXT` record authorizing the provider, e.g.
     `v=spf1 include:_spf.resend.com ~all`
   - **DKIM**: the `CNAME`/`TXT` keys the provider generates (DKIM is what makes
     Gmail trust the mail — this is the single most important record for
     deliverability).
   - **DMARC** (recommended): `TXT` at `_dmarc.<domain>`, e.g.
     `v=DMARC1; p=none; rua=mailto:dmarc@haseeela.app`
   - Wait for the provider dashboard to show all records **Verified**.
3. In Supabase **SMTP Settings**, enter:
   - **Host**: e.g. `smtp.resend.com`
   - **Port**: `465` (SSL) or `587` (STARTTLS)
   - **Username**: provider SMTP user (Resend: literally `resend`)
   - **Password**: the provider **API key / SMTP password**
   - **Sender email**: an address **on your verified domain**, e.g.
     `no-reply@mail.haseeela.app` (must match the domain you verified, or mail is
     rejected)
   - **Sender name**: `Haseeela`
4. Save. Send a test signup — verify the email now arrives from your domain.

### Raise the auth rate limits

**Dashboard → Authentication → Rate Limits** — once custom SMTP is active, raise
**"Rate limit for sending emails"** to match your provider's quota (e.g.
30–100/hour) so normal signup/reset traffic is no longer throttled.

---

## 4. Other Auth settings to confirm

- **Authentication → Providers → Email**: "Confirm email" **ON** (the app's
  signup flow expects confirmation), "Secure email change" ON.
- **Authentication → Sessions**: defaults are fine. The app uses the implicit
  flow with `detectSessionInUrl: false`; recovery/confirmation tokens are
  exchanged explicitly in code.
- **Leaked password protection** (Authentication → Policies): consider enabling.

---

## 5. How the code now protects the reset flow (summary)

The application code was hardened so that even a misconfigured dashboard cannot
cause an account/session mix-up:

| Safeguard | File |
| --- | --- |
| Reset uses an **isolated, non-persistent** Supabase client — the recovery session never touches the shared app session | `src/lib/supabaseClient.ts` (`createIsolatedSupabaseClient`) |
| **Any existing session is cleared** before processing a reset | `src/app/reset-password/page.tsx` |
| Reset **only** accepts an explicit recovery token from the URL; **never** falls back to a stale `getSession()` | `src/app/reset-password/page.tsx` |
| `updateUser({ password })` runs **only after submit**, on the isolated client; user must then log in fresh | `src/app/reset-password/page.tsx` |
| The reset page **shows which account/email** the link is for | `src/app/reset-password/page.tsx` |
| `/verify` **forwards `type=recovery` tokens to `/reset-password`** and never logs in off a stale session | `src/app/verify/page.tsx` |
| Structured `[auth]` logging of every step and auth-state change (enable in prod via `NEXT_PUBLIC_AUTH_DEBUG=true`) | `src/lib/authDebug.ts`, `src/components/AuthProvider.tsx` |
| Friendly rate-limit messaging incl. the `over_email_send_rate_limit` code | `src/lib/authEmailRateLimit.ts` |
