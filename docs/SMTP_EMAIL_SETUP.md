# Email Setup — Invoice Sending (SMTP) & Branded Auth Emails

This covers two things:
1. **Invoice email sending** via SMTP (app code) — env vars, Gmail temporary setup, switching to a domain later.
2. **Branded Supabase auth emails** (confirm signup, reset password, etc.) — using the same Gmail as Supabase custom SMTP, plus ready-to-paste branded templates.

---

## 1. Invoice sending — required environment variables

Add these in **Vercel → Project → Settings → Environment Variables** (Production, and Preview if you want it there too). The app reads them server-side only.

| Variable | Example | Notes |
| --- | --- | --- |
| `SMTP_HOST` | `smtp.gmail.com` | SMTP server host |
| `SMTP_PORT` | `587` | `587` (STARTTLS) or `465` (SSL) |
| `SMTP_SECURE` | `false` | `true` only for port `465` |
| `SMTP_USER` | `haseeela@gmail.com` | Full login / mailbox |
| `SMTP_PASS` | `xxxx xxxx xxxx xxxx` | **App Password** (see below). Secret — set only in Vercel |
| `SMTP_FROM` | `haseeela@gmail.com` | From address (Gmail requires this == `SMTP_USER`) |
| `SMTP_FROM_NAME` | `Haseeela` | Display name on outgoing mail |

**Behaviour:**
- If **all required** vars (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`) are present → the **Send invoice** modal emails a branded HTML message with the **invoice PDF attached**, and the invoice is marked **Sent** only after a successful send.
- If they are **missing** → the modal shows a clear "SMTP is not configured" message with **Download PDF** and **Open in my email app (mailto)** fallbacks, and the invoice is **not** marked Sent.

**Security**
- `SMTP_PASS` is never logged, never returned to the browser, and never embedded in error messages.
- Never commit real values. `.env.example` holds placeholders only; `.env.local` is gitignored.
- ⚠️ If an App Password was ever shared in plaintext (chat, screenshot, commit), **revoke and regenerate it** — treat it as compromised.

---

## 2. Gmail App Password (temporary sender)

Gmail blocks plain password SMTP. Use an **App Password** (needs 2-Step Verification):

1. Google Account → **Security** → enable **2-Step Verification**.
2. Security → **App passwords** → create one (e.g. name it "Haseeela SMTP").
3. Copy the 16-character password and use it as **`SMTP_PASS`** in Vercel (spaces optional).
4. Set `SMTP_USER` and `SMTP_FROM` to that Gmail address.

Gmail caps free sending at roughly **500 messages/day** — fine for early invoicing.

---

## 3. Switching to a domain SMTP later (when you buy the Haseeela domain)

When you have a real domain and a transactional provider (Resend / SendGrid / Postmark / Amazon SES):

1. Verify the domain with the provider and add the **SPF + DKIM (+ DMARC)** DNS records they give you (DKIM is what gets you into the inbox).
2. Update the same Vercel env vars to the provider's SMTP, e.g. Resend:
   - `SMTP_HOST=smtp.resend.com`, `SMTP_PORT=465`, `SMTP_SECURE=true`
   - `SMTP_USER=resend`, `SMTP_PASS=<resend API key>`
   - `SMTP_FROM=no-reply@mail.haseeela.com`, `SMTP_FROM_NAME=Haseeela`
3. Redeploy. **No code changes** — the app is provider-agnostic.

---

## 4. Use the same Gmail as Supabase custom SMTP (fixes auth email delivery + rate limits)

The auth emails (confirm signup, reset password) currently use Supabase's built-in sender, which is rate-limited and lands in spam. Point Supabase at the same Gmail:

**Supabase → Authentication → Emails → SMTP Settings → Enable Custom SMTP**
- Host `smtp.gmail.com` · Port `587` · Username `haseeela@gmail.com` · Password `<App Password>`
- Sender email `haseeela@gmail.com` · Sender name `Haseeela`

Then **Authentication → Rate Limits** → raise "emails per hour" to a sane value (e.g. 50–100).

> Gmail is fine as a stopgap. For production deliverability move to a domain + provider (section 3) and set Supabase SMTP to that provider too.

---

## 5. Branded Supabase auth email templates

Paste these into **Supabase → Authentication → Email Templates**. They match the Haseeela brand (accent `#6D5EFC`). Keep the Supabase template variables (`{{ .ConfirmationURL }}`, etc.) intact.

### Confirm sign up
```html
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F4F6;padding:28px 12px;font-family:Arial,Helvetica,sans-serif;">
  <tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border:1px solid #E7E7EC;border-radius:16px;overflow:hidden;">
      <tr><td style="background:#6D5EFC;padding:22px 28px;color:#fff;font-size:18px;font-weight:700;">Haseeela</td></tr>
      <tr><td style="padding:28px;">
        <h1 style="margin:0 0 14px;font-size:20px;color:#18181B;">Confirm your email</h1>
        <p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#18181B;">Welcome to Haseeela! Confirm your email address to activate your workspace.</p>
        <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:12px 24px;font-size:15px;font-weight:600;color:#fff;text-decoration:none;border-radius:10px;background:#6D5EFC;">Confirm email</a>
        <p style="margin:18px 0 0;font-size:12px;color:#71717A;">If you didn't create this account, you can ignore this email.</p>
      </td></tr>
      <tr><td style="padding:18px 28px;border-top:1px solid #E7E7EC;font-size:12px;color:#71717A;">Haseeela · Freelance finance, organised.</td></tr>
    </table>
  </td></tr>
</table>
```

### Reset password
```html
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F4F6;padding:28px 12px;font-family:Arial,Helvetica,sans-serif;">
  <tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border:1px solid #E7E7EC;border-radius:16px;overflow:hidden;">
      <tr><td style="background:#6D5EFC;padding:22px 28px;color:#fff;font-size:18px;font-weight:700;">Haseeela</td></tr>
      <tr><td style="padding:28px;">
        <h1 style="margin:0 0 14px;font-size:20px;color:#18181B;">Reset your password</h1>
        <p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#18181B;">Click below to choose a new password for your Haseeela account. This link expires shortly.</p>
        <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:12px 24px;font-size:15px;font-weight:600;color:#fff;text-decoration:none;border-radius:10px;background:#6D5EFC;">Set a new password</a>
        <p style="margin:18px 0 0;font-size:12px;color:#71717A;">Didn't request this? You can safely ignore this email — your password won't change.</p>
      </td></tr>
      <tr><td style="padding:18px 28px;border-top:1px solid #E7E7EC;font-size:12px;color:#71717A;">Haseeela · Freelance finance, organised.</td></tr>
    </table>
  </td></tr>
</table>
```

### Magic link / Email change
Reuse the same wrapper, swapping the heading/copy and keeping `{{ .ConfirmationURL }}` (and `{{ .Email }}` / `{{ .NewEmail }}` for email-change).

> Reminder (from the auth fix): keep **`/reset-password`** and **`/verify`** in **Authentication → URL Configuration → Redirect URLs**, and the Site URL set to the app origin — otherwise recovery links fall back to the wrong page.

---

## 6. How to test

See the testing checklist at the end of the PR description, but in short:
- **No SMTP** → Send shows the fallback (PDF + mailto); invoice stays Draft.
- **Invalid email** → inline validation error, no send.
- **Download PDF** → branded PDF downloads.
- **With SMTP** → email arrives with PDF attached; invoice flips to **Sent** only then.
