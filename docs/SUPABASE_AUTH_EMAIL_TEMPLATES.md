# Haseeela — Supabase Auth Email Templates

Production-ready, branded HTML for **every** Supabase Auth email. Paste each block into
**Supabase Dashboard → Authentication → Emails → Templates**.

- **App:** Haseeela — freelance budget tracking, invoices, clients, revenue, expenses, subscriptions, reports.
- **Sender name:** Haseeela · **Sender email:** `haseeela@gmail.com` (temporary; move to a domain address later).
- **Current site:** https://freelancer-budget-tracker-web.vercel.app
- **Design:** matches the in-app invoice emails (`apps/web/src/server/emailTemplate.ts`) — accent `#6D5EFC`, white 560px card, text logo "Haseeela", inline CSS only, mobile-friendly.

> These templates change **no runtime behavior** — they only restyle the emails Supabase already sends. Keep every `{{ . }}` variable exactly as written.

---

## Design tokens (for reference)
| Token | Value |
| --- | --- |
| Accent | `#6D5EFC` |
| Accent (border/link) | `#5B4FE0` |
| Ink (headings) | `#18181B` |
| Body text | `#3F3F46` |
| Muted | `#71717A` |
| Border | `#E7E7EC` |
| Page background | `#F4F4F6` |

## Supabase variables reference
| Variable | Meaning | Available in |
| --- | --- | --- |
| `{{ .ConfirmationURL }}` | Full action link (verify endpoint + your `redirect_to`) | Confirm signup, Invite, Magic Link, Change Email, Reset Password |
| `{{ .Token }}` | 6-digit OTP code | Confirm signup, Magic Link, Reauthentication (+ others) |
| `{{ .TokenHash }}` | Hashed token (for building your own verify URL) | Most templates |
| `{{ .SiteURL }}` | Project Site URL | All |
| `{{ .Email }}` | Recipient's current email | All |
| `{{ .NewEmail }}` | The new email being set | Change Email only |
| `{{ .RedirectTo }}` | The app redirect target | Where a redirect was passed |

> Supabase exposes exactly these **6** template types in the dashboard — there is no 7th. This file covers all of them.

---

## 1. Confirm sign up

**Subject:** `Confirm your email to start using Haseeela`

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light only">
  <title>Confirm your email</title>
</head>
<body style="margin:0;padding:0;background:#F4F4F6;-webkit-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Confirm your email to activate your Haseeela workspace.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F4F6;">
    <tr><td align="center" style="padding:28px 12px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border:1px solid #E7E7EC;border-radius:16px;overflow:hidden;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
        <tr><td style="background:#6D5EFC;padding:22px 28px;">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td style="width:34px;height:34px;background:rgba(255,255,255,0.18);border-radius:9px;text-align:center;vertical-align:middle;font-size:18px;font-weight:700;color:#ffffff;">H</td>
            <td style="padding-left:11px;color:#ffffff;font-size:18px;font-weight:700;letter-spacing:-0.02em;">Haseeela</td>
          </tr></table>
        </td></tr>
        <tr><td style="padding:30px 28px;">
          <h1 style="margin:0 0 14px;font-size:20px;line-height:1.3;color:#18181B;font-weight:700;">Confirm your email</h1>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#3F3F46;">Welcome to Haseeela — your home for tracking income, expenses, clients and invoices. Confirm your email address to activate your workspace and continue.</p>
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:4px 0 18px;"><tr>
            <td style="border-radius:10px;background:#6D5EFC;">
              <a href="{{ .ConfirmationURL }}" target="_blank" style="display:inline-block;padding:13px 26px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;border:1px solid #5B4FE0;">Confirm email &amp; continue</a>
            </td>
          </tr></table>
          <p style="margin:0 0 6px;font-size:13px;color:#71717A;">Or paste this link into your browser:</p>
          <p style="margin:0 0 18px;font-size:13px;line-height:1.5;word-break:break-all;"><a href="{{ .ConfirmationURL }}" style="color:#5B4FE0;text-decoration:underline;">{{ .ConfirmationURL }}</a></p>
          <p style="margin:0;font-size:13px;line-height:1.6;color:#71717A;">If you didn't create a Haseeela account, you can safely ignore this email.</p>
        </td></tr>
        <tr><td style="padding:18px 28px;border-top:1px solid #E7E7EC;background:#FBFBFD;">
          <p style="margin:0 0 4px;font-size:12px;line-height:1.6;color:#71717A;">You received this email because you requested this action in Haseeela.</p>
          <p style="margin:0;font-size:12px;line-height:1.6;color:#A1A1AA;">Haseeela · Freelance finance, organised.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
```
- **Variables used:** `{{ .ConfirmationURL }}`.
- **Dashboard:** `ConfirmationURL` resolves to your **Site URL** unless a `redirect_to` is passed; the app uses `…/verify`. Keep `…/verify` in **Authentication → URL Configuration → Redirect URLs**.

---

## 2. Invite user

**Subject:** `You've been invited to Haseeela`

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light only">
  <title>You're invited to Haseeela</title>
</head>
<body style="margin:0;padding:0;background:#F4F4F6;-webkit-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">You've been invited to join Haseeela.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F4F6;">
    <tr><td align="center" style="padding:28px 12px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border:1px solid #E7E7EC;border-radius:16px;overflow:hidden;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
        <tr><td style="background:#6D5EFC;padding:22px 28px;">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td style="width:34px;height:34px;background:rgba(255,255,255,0.18);border-radius:9px;text-align:center;vertical-align:middle;font-size:18px;font-weight:700;color:#ffffff;">H</td>
            <td style="padding-left:11px;color:#ffffff;font-size:18px;font-weight:700;letter-spacing:-0.02em;">Haseeela</td>
          </tr></table>
        </td></tr>
        <tr><td style="padding:30px 28px;">
          <h1 style="margin:0 0 14px;font-size:20px;line-height:1.3;color:#18181B;font-weight:700;">You're invited to Haseeela</h1>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#3F3F46;">You've been invited to join <strong>Haseeela</strong> — a simple, modern way to track freelance income, expenses, clients and invoices. Accept your invite to set up your account.</p>
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:4px 0 18px;"><tr>
            <td style="border-radius:10px;background:#6D5EFC;">
              <a href="{{ .ConfirmationURL }}" target="_blank" style="display:inline-block;padding:13px 26px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;border:1px solid #5B4FE0;">Accept invite</a>
            </td>
          </tr></table>
          <p style="margin:0 0 6px;font-size:13px;color:#71717A;">Or paste this link into your browser:</p>
          <p style="margin:0 0 18px;font-size:13px;line-height:1.5;word-break:break-all;"><a href="{{ .ConfirmationURL }}" style="color:#5B4FE0;text-decoration:underline;">{{ .ConfirmationURL }}</a></p>
          <p style="margin:0;font-size:13px;line-height:1.6;color:#71717A;">This invite was sent to {{ .Email }}. If you weren't expecting it, you can safely ignore this email.</p>
        </td></tr>
        <tr><td style="padding:18px 28px;border-top:1px solid #E7E7EC;background:#FBFBFD;">
          <p style="margin:0 0 4px;font-size:12px;line-height:1.6;color:#71717A;">You received this email because someone invited you to Haseeela.</p>
          <p style="margin:0;font-size:12px;line-height:1.6;color:#A1A1AA;">Haseeela · Freelance finance, organised.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
```
- **Variables used:** `{{ .ConfirmationURL }}`, `{{ .Email }}`.
- **Dashboard:** Invites are sent from **Authentication → Users → Invite**. The accept link lands on your Site URL / configured redirect.

---

## 3. Magic Link / OTP

**Subject:** `Your Haseeela sign-in link`

Supports **both** one-click link and a typed 6-digit code.

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light only">
  <title>Your sign-in link</title>
</head>
<body style="margin:0;padding:0;background:#F4F4F6;-webkit-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Your Haseeela sign-in link and code.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F4F6;">
    <tr><td align="center" style="padding:28px 12px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border:1px solid #E7E7EC;border-radius:16px;overflow:hidden;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
        <tr><td style="background:#6D5EFC;padding:22px 28px;">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td style="width:34px;height:34px;background:rgba(255,255,255,0.18);border-radius:9px;text-align:center;vertical-align:middle;font-size:18px;font-weight:700;color:#ffffff;">H</td>
            <td style="padding-left:11px;color:#ffffff;font-size:18px;font-weight:700;letter-spacing:-0.02em;">Haseeela</td>
          </tr></table>
        </td></tr>
        <tr><td style="padding:30px 28px;">
          <h1 style="margin:0 0 14px;font-size:20px;line-height:1.3;color:#18181B;font-weight:700;">Sign in to Haseeela</h1>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#3F3F46;">Use the button below to sign in instantly. This link works once and expires shortly.</p>
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:4px 0 18px;"><tr>
            <td style="border-radius:10px;background:#6D5EFC;">
              <a href="{{ .ConfirmationURL }}" target="_blank" style="display:inline-block;padding:13px 26px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;border:1px solid #5B4FE0;">Sign in to Haseeela</a>
            </td>
          </tr></table>
          <p style="margin:0 0 6px;font-size:13px;color:#71717A;">Or paste this link into your browser:</p>
          <p style="margin:0 0 18px;font-size:13px;line-height:1.5;word-break:break-all;"><a href="{{ .ConfirmationURL }}" style="color:#5B4FE0;text-decoration:underline;">{{ .ConfirmationURL }}</a></p>
          <div style="margin:0 0 18px;padding:16px;background:#F4F4F6;border:1px solid #E7E7EC;border-radius:12px;text-align:center;">
            <div style="font-size:13px;color:#71717A;margin-bottom:8px;">Prefer a code? Enter this instead:</div>
            <div style="font-size:30px;font-weight:700;letter-spacing:8px;color:#18181B;font-family:Menlo,Consolas,'Courier New',monospace;">{{ .Token }}</div>
          </div>
          <p style="margin:0;font-size:13px;line-height:1.6;color:#71717A;">If you didn't try to sign in, you can safely ignore this email.</p>
        </td></tr>
        <tr><td style="padding:18px 28px;border-top:1px solid #E7E7EC;background:#FBFBFD;">
          <p style="margin:0 0 4px;font-size:12px;line-height:1.6;color:#71717A;">You received this email because you requested this action in Haseeela.</p>
          <p style="margin:0;font-size:12px;line-height:1.6;color:#A1A1AA;">Haseeela · Freelance finance, organised.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
```
- **Variables used:** `{{ .ConfirmationURL }}` (link) and `{{ .Token }}` (OTP).
- **Notes:** If you only use link-based magic links, you can delete the code block; if you only use OTP, delete the button + link.

---

## 4. Change Email Address

**Subject:** `Confirm your new email for Haseeela`

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light only">
  <title>Confirm your new email</title>
</head>
<body style="margin:0;padding:0;background:#F4F4F6;-webkit-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Confirm the email change on your Haseeela account.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F4F6;">
    <tr><td align="center" style="padding:28px 12px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border:1px solid #E7E7EC;border-radius:16px;overflow:hidden;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
        <tr><td style="background:#6D5EFC;padding:22px 28px;">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td style="width:34px;height:34px;background:rgba(255,255,255,0.18);border-radius:9px;text-align:center;vertical-align:middle;font-size:18px;font-weight:700;color:#ffffff;">H</td>
            <td style="padding-left:11px;color:#ffffff;font-size:18px;font-weight:700;letter-spacing:-0.02em;">Haseeela</td>
          </tr></table>
        </td></tr>
        <tr><td style="padding:30px 28px;">
          <h1 style="margin:0 0 14px;font-size:20px;line-height:1.3;color:#18181B;font-weight:700;">Confirm your new email</h1>
          <p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#3F3F46;">We received a request to change the email on your Haseeela account.</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px;border:1px solid #E7E7EC;border-radius:10px;border-collapse:separate;overflow:hidden;">
            <tr><td style="padding:11px 16px;font-size:13px;color:#71717A;">Current email</td><td style="padding:11px 16px;font-size:14px;text-align:right;color:#18181B;font-weight:500;">{{ .Email }}</td></tr>
            <tr><td style="padding:11px 16px;font-size:13px;color:#71717A;border-top:1px solid #E7E7EC;">New email</td><td style="padding:11px 16px;font-size:14px;text-align:right;color:#18181B;font-weight:700;border-top:1px solid #E7E7EC;">{{ .NewEmail }}</td></tr>
          </table>
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 18px;"><tr>
            <td style="border-radius:10px;background:#6D5EFC;">
              <a href="{{ .ConfirmationURL }}" target="_blank" style="display:inline-block;padding:13px 26px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;border:1px solid #5B4FE0;">Confirm email change</a>
            </td>
          </tr></table>
          <p style="margin:0 0 6px;font-size:13px;color:#71717A;">Or paste this link into your browser:</p>
          <p style="margin:0 0 18px;font-size:13px;line-height:1.5;word-break:break-all;"><a href="{{ .ConfirmationURL }}" style="color:#5B4FE0;text-decoration:underline;">{{ .ConfirmationURL }}</a></p>
          <p style="margin:0;font-size:13px;line-height:1.6;color:#71717A;">If you didn't request this change, do not click the link — your email will stay the same. You can safely ignore this message.</p>
        </td></tr>
        <tr><td style="padding:18px 28px;border-top:1px solid #E7E7EC;background:#FBFBFD;">
          <p style="margin:0 0 4px;font-size:12px;line-height:1.6;color:#71717A;">You received this email because you requested this action in Haseeela.</p>
          <p style="margin:0;font-size:12px;line-height:1.6;color:#A1A1AA;">Haseeela · Freelance finance, organised.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
```
- **Variables used:** `{{ .Email }}` (current), `{{ .NewEmail }}`, `{{ .ConfirmationURL }}`.
- **Dashboard:** With **Secure email change** enabled (recommended), Supabase emails **both** addresses; this template works for both.

---

## 5. Reset Password

**Subject:** `Reset your Haseeela password`

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light only">
  <title>Reset your password</title>
</head>
<body style="margin:0;padding:0;background:#F4F4F6;-webkit-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Set a new password for your Haseeela account.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F4F6;">
    <tr><td align="center" style="padding:28px 12px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border:1px solid #E7E7EC;border-radius:16px;overflow:hidden;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
        <tr><td style="background:#6D5EFC;padding:22px 28px;">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td style="width:34px;height:34px;background:rgba(255,255,255,0.18);border-radius:9px;text-align:center;vertical-align:middle;font-size:18px;font-weight:700;color:#ffffff;">H</td>
            <td style="padding-left:11px;color:#ffffff;font-size:18px;font-weight:700;letter-spacing:-0.02em;">Haseeela</td>
          </tr></table>
        </td></tr>
        <tr><td style="padding:30px 28px;">
          <h1 style="margin:0 0 14px;font-size:20px;line-height:1.3;color:#18181B;font-weight:700;">Set a new password</h1>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#3F3F46;">We received a request to reset the password for your Haseeela account ({{ .Email }}). Click below to securely choose a new password. This link expires shortly and can be used once.</p>
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:4px 0 18px;"><tr>
            <td style="border-radius:10px;background:#6D5EFC;">
              <a href="{{ .ConfirmationURL }}" target="_blank" style="display:inline-block;padding:13px 26px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;border:1px solid #5B4FE0;">Set a new password</a>
            </td>
          </tr></table>
          <p style="margin:0 0 6px;font-size:13px;color:#71717A;">Or paste this link into your browser:</p>
          <p style="margin:0 0 18px;font-size:13px;line-height:1.5;word-break:break-all;"><a href="{{ .ConfirmationURL }}" style="color:#5B4FE0;text-decoration:underline;">{{ .ConfirmationURL }}</a></p>
          <p style="margin:0;font-size:13px;line-height:1.6;color:#71717A;">If you didn't request a password reset, you can safely ignore this email — your password won't change.</p>
        </td></tr>
        <tr><td style="padding:18px 28px;border-top:1px solid #E7E7EC;background:#FBFBFD;">
          <p style="margin:0 0 4px;font-size:12px;line-height:1.6;color:#71717A;">You received this email because you requested this action in Haseeela.</p>
          <p style="margin:0;font-size:12px;line-height:1.6;color:#A1A1AA;">Haseeela · Freelance finance, organised.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
```
- **Variables used:** `{{ .ConfirmationURL }}`, `{{ .Email }}`.
- **Dashboard (important):** `ConfirmationURL` must route to the app's secure reset page. Keep **`…/reset-password`** in **Authentication → URL Configuration → Redirect URLs** (the app passes `redirect_to=…/reset-password`). Without it, Supabase falls back to the Site URL and the reset flow breaks.

---

## 6. Reauthentication

**Subject:** `Your Haseeela verification code`

Reauthentication is **OTP-only** (no link) — used to confirm identity before a sensitive action.

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light only">
  <title>Your verification code</title>
</head>
<body style="margin:0;padding:0;background:#F4F4F6;-webkit-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Your Haseeela verification code.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F4F6;">
    <tr><td align="center" style="padding:28px 12px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border:1px solid #E7E7EC;border-radius:16px;overflow:hidden;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
        <tr><td style="background:#6D5EFC;padding:22px 28px;">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td style="width:34px;height:34px;background:rgba(255,255,255,0.18);border-radius:9px;text-align:center;vertical-align:middle;font-size:18px;font-weight:700;color:#ffffff;">H</td>
            <td style="padding-left:11px;color:#ffffff;font-size:18px;font-weight:700;letter-spacing:-0.02em;">Haseeela</td>
          </tr></table>
        </td></tr>
        <tr><td style="padding:30px 28px;">
          <h1 style="margin:0 0 14px;font-size:20px;line-height:1.3;color:#18181B;font-weight:700;">Confirm it's you</h1>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#3F3F46;">For your security, Haseeela needs to verify your identity before completing this action. Enter the code below to continue.</p>
          <div style="margin:0 0 18px;padding:18px;background:#F4F4F6;border:1px solid #E7E7EC;border-radius:12px;text-align:center;">
            <div style="font-size:13px;color:#71717A;margin-bottom:8px;">Verification code</div>
            <div style="font-size:32px;font-weight:700;letter-spacing:10px;color:#18181B;font-family:Menlo,Consolas,'Courier New',monospace;">{{ .Token }}</div>
          </div>
          <p style="margin:0;font-size:13px;line-height:1.6;color:#71717A;">This code expires soon. If you didn't start a sensitive action in Haseeela, do not share this code and you can safely ignore this email.</p>
        </td></tr>
        <tr><td style="padding:18px 28px;border-top:1px solid #E7E7EC;background:#FBFBFD;">
          <p style="margin:0 0 4px;font-size:12px;line-height:1.6;color:#71717A;">You received this email because a sensitive action was requested in Haseeela.</p>
          <p style="margin:0;font-size:12px;line-height:1.6;color:#A1A1AA;">Haseeela · Freelance finance, organised.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
```
- **Variables used:** `{{ .Token }}` (6-digit OTP). No `ConfirmationURL` for this type.

---

## Where to paste — dashboard checklist

**Supabase → Authentication → Emails → Templates** (each has its own tab):

- [ ] **Confirm signup** → subject + Template 1 HTML
- [ ] **Invite user** → subject + Template 2 HTML
- [ ] **Magic Link** → subject + Template 3 HTML
- [ ] **Change Email Address** → subject + Template 4 HTML
- [ ] **Reset Password** → subject + Template 5 HTML
- [ ] **Reauthentication** → subject + Template 6 HTML

For each: paste the **Subject** into the subject field and the **full HTML** into the message body, then **Save**. Send yourself a test for each (sign up, reset, etc.).

**Required URL configuration** (Authentication → URL Configuration):
- [ ] **Site URL:** `https://freelancer-budget-tracker-web.vercel.app`
- [ ] **Redirect URLs include:** `…/verify` and `…/reset-password` (prod + localhost). See `docs/SUPABASE_AUTH_SETUP.md`.

**Deliverability — enable custom SMTP** (Authentication → Emails → SMTP Settings):
- [ ] Enable **Custom SMTP** (e.g. the same `smtp.gmail.com` you use for invoices, or a domain provider later). The built-in sender is rate-limited (~2–4/hour) and often lands in spam.
- [ ] After enabling, raise **Rate Limits → emails per hour**.
- [ ] **Do not** paste SMTP passwords into this repo — set them only in the Supabase dashboard. Full SMTP guidance: `docs/SMTP_EMAIL_SETUP.md`.

---

## Risks & limitations
- **Dashboard-only:** Supabase auth email templates live in the dashboard, not the repo. This file is the source of truth — re-paste here if they're edited in the dashboard. (They can also be managed via the Management API / `config.toml`, but manual paste is simplest here.)
- **No external images:** uses a CSS text badge ("H") + wordmark, so nothing breaks if images are blocked. If you later add a hosted logo PNG, swap the badge `<td>` for an `<img>` with a `width`/`height` and `alt="Haseeela"`.
- **Outlook button:** the button is a table-cell link (renders reliably across Gmail/Apple Mail/Outlook). It won't have rounded corners in some old Outlook builds, but stays clickable and on-brand. The plain-text fallback link is always present.
- **OTP vs link:** Magic Link includes both a link and a code. Reauthentication is OTP-only by design. Trim the unused part if your flows only use one.
- **Variable accuracy:** only the variables listed per template are guaranteed for that email type. Don't add `{{ .NewEmail }}` outside the Change Email template, etc.
- **No runtime change:** these templates don't alter app behavior; the recovery/confirm flows still depend on the Redirect URL settings above.
