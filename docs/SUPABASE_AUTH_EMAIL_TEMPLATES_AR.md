# Haseeela — Arabic Supabase Auth Email Templates (RTL)

> Arabic, RTL, email-client-safe versions of all six Supabase Auth emails. Mirrors the branding of the English set in [`SUPABASE_AUTH_EMAIL_TEMPLATES.md`](./SUPABASE_AUTH_EMAIL_TEMPLATES.md) (accent `#6D5EFC`, "Haseeela" wordmark, 560px card, inline CSS only).
> **Paste into:** Supabase Dashboard → **Authentication → Emails/Templates**. These are dashboard config, **not** app code.

## 🌐 Bilingual context (read first)
The app is **bilingual (English + Arabic)**, but **Supabase sends ONE template per type and cannot pick a language per user**. So choose one strategy and document it:
- **(Recommended) Bilingual stacked template** — paste the **English block then the Arabic block** (separated by a divider) into each of the 6 template slots, so every recipient gets both languages in one email. Use the English HTML from [`SUPABASE_AUTH_EMAIL_TEMPLATES.md`](./SUPABASE_AUTH_EMAIL_TEMPLATES.md) on top + the Arabic HTML below it. Keep a single set of `{{ … }}` variables (don't duplicate the action link confusingly — one CTA per language pointing at the same `{{ .ConfirmationURL }}` is fine).
- **(Alternative) Primary language** — pick the org's main audience language and paste only that set.
- **(Future)** A custom auth-email hook could branch by the user's stored locale once `User.locale` exists — out of scope now.

The Arabic templates below are ready to use **as-is** (Arabic-only slot) or **as the Arabic half** of a bilingual stacked template.

## ⚠ Hard rules
- **Never** translate or modify Supabase variables — keep them exactly:
  `{{ .ConfirmationURL }}`, `{{ .Token }}`, `{{ .Email }}`, `{{ .NewEmail }}`, `{{ .SiteURL }}`, `{{ .RedirectTo }}`.
- Keep **`…/verify`** and **`…/reset-password`** in **Authentication → URL Configuration → Redirect URLs** (production + localhost). The change-email and signup links resolve to `…/verify`; password reset resolves to `…/reset-password`.
- Keep **Secure email change ENABLED** (per owner's decision) — Supabase sends the Change-Email template to **both** the old and new address; this single template works for both.
- Email clients don't reliably load webfonts → use a **system Arabic-capable stack**: `'Segoe UI','Tahoma',Arial,sans-serif`.
- RTL: container is `dir="rtl"` with right alignment; the **"Haseeela" wordmark, URLs, and OTP token stay LTR**.
- Test in **Gmail, Apple Mail, Outlook** before going live.

---

## Shared design notes
- Page bg `#F4F4F6`, card `#FFFFFF`, ink `#18181B`, muted `#71717A`, border `#E7E7EC`, accent `#6D5EFC`, accent-dark `#5B4FE0`.
- Each template: hidden preheader → wordmark → heading → body → CTA button (where relevant) → plain-link fallback → security note → footer.
- Replace nothing inside `{{ … }}`.

---

## 1. Confirm sign up — تأكيد إنشاء الحساب

**Subject:** `أكّد بريدك الإلكتروني للبدء في Haseeela`
**Variables:** `{{ .ConfirmationURL }}`

```html
<!doctype html>
<html lang="ar" dir="rtl">
  <body style="margin:0;padding:0;background:#F4F4F6;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">أكّد بريدك الإلكتروني لتفعيل حسابك في Haseeela.</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F4F6;padding:32px 12px;">
      <tr><td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="width:560px;max-width:100%;background:#FFFFFF;border:1px solid #E7E7EC;border-radius:16px;overflow:hidden;font-family:'Segoe UI','Tahoma',Arial,sans-serif;">
          <tr><td style="padding:28px 32px 0;text-align:right;">
            <span style="font-size:20px;font-weight:700;color:#6D5EFC;direction:ltr;unicode-bidi:isolate;">Haseeela</span>
          </td></tr>
          <tr><td style="padding:18px 32px 6px;text-align:right;">
            <h1 style="margin:0;font-size:22px;line-height:1.4;color:#18181B;">مرحبًا بك في Haseeela 👋</h1>
          </td></tr>
          <tr><td style="padding:6px 32px 0;text-align:right;">
            <p style="margin:0 0 14px;font-size:15px;line-height:1.7;color:#18181B;">اضغط على الزر أدناه لتأكيد بريدك الإلكتروني وتفعيل حسابك والبدء في إدارة عملائك وفواتيرك وإيراداتك.</p>
          </td></tr>
          <tr><td style="padding:8px 32px 4px;text-align:right;">
            <table role="presentation" cellpadding="0" cellspacing="0"><tr>
              <td style="border-radius:10px;background:#6D5EFC;">
                <a href="{{ .ConfirmationURL }}" target="_blank" style="display:inline-block;padding:13px 26px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;border:1px solid #5B4FE0;">تأكيد البريد والمتابعة</a>
              </td>
            </tr></table>
          </td></tr>
          <tr><td style="padding:16px 32px 0;text-align:right;">
            <p style="margin:0 0 6px;font-size:13px;color:#71717A;">إذا لم يعمل الزر، انسخ هذا الرابط في المتصفح:</p>
            <p style="margin:0 0 18px;font-size:13px;line-height:1.5;word-break:break-all;direction:ltr;text-align:left;"><a href="{{ .ConfirmationURL }}" style="color:#5B4FE0;text-decoration:underline;">{{ .ConfirmationURL }}</a></p>
          </td></tr>
          <tr><td style="padding:0 32px 24px;text-align:right;border-top:1px solid #E7E7EC;">
            <p style="margin:16px 0 0;font-size:12px;line-height:1.6;color:#71717A;">لأمانك: هذا الرابط صالح لمرة واحدة ولفترة محدودة. إذا لم تطلب إنشاء حساب في Haseeela، تجاهل هذه الرسالة.</p>
          </td></tr>
        </table>
        <p style="margin:16px 0 0;font-size:12px;color:#A1A1AA;font-family:'Segoe UI','Tahoma',Arial,sans-serif;">أُرسلت هذه الرسالة لأنك طلبت إنشاء حساب في Haseeela.</p>
      </td></tr>
    </table>
  </body>
</html>
```

---

## 2. Invite user — دعوة مستخدم

**Subject:** `لقد تمت دعوتك إلى Haseeela`
**Variables:** `{{ .ConfirmationURL }}`, `{{ .Email }}`

```html
<!doctype html>
<html lang="ar" dir="rtl">
  <body style="margin:0;padding:0;background:#F4F4F6;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">لقد تمت دعوتك للانضمام إلى Haseeela.</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F4F6;padding:32px 12px;">
      <tr><td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="width:560px;max-width:100%;background:#FFFFFF;border:1px solid #E7E7EC;border-radius:16px;overflow:hidden;font-family:'Segoe UI','Tahoma',Arial,sans-serif;">
          <tr><td style="padding:28px 32px 0;text-align:right;"><span style="font-size:20px;font-weight:700;color:#6D5EFC;direction:ltr;unicode-bidi:isolate;">Haseeela</span></td></tr>
          <tr><td style="padding:18px 32px 6px;text-align:right;"><h1 style="margin:0;font-size:22px;line-height:1.4;color:#18181B;">لقد تمت دعوتك إلى Haseeela</h1></td></tr>
          <tr><td style="padding:6px 32px 0;text-align:right;">
            <p style="margin:0 0 14px;font-size:15px;line-height:1.7;color:#18181B;">تمت دعوة <span style="direction:ltr;unicode-bidi:isolate;color:#18181B;font-weight:600;">{{ .Email }}</span> للانضمام إلى Haseeela. اقبل الدعوة لإعداد حسابك.</p>
          </td></tr>
          <tr><td style="padding:8px 32px 4px;text-align:right;">
            <table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="border-radius:10px;background:#6D5EFC;">
              <a href="{{ .ConfirmationURL }}" target="_blank" style="display:inline-block;padding:13px 26px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;border:1px solid #5B4FE0;">قبول الدعوة</a>
            </td></tr></table>
          </td></tr>
          <tr><td style="padding:16px 32px 0;text-align:right;">
            <p style="margin:0 0 6px;font-size:13px;color:#71717A;">أو انسخ هذا الرابط في المتصفح:</p>
            <p style="margin:0 0 18px;font-size:13px;line-height:1.5;word-break:break-all;direction:ltr;text-align:left;"><a href="{{ .ConfirmationURL }}" style="color:#5B4FE0;text-decoration:underline;">{{ .ConfirmationURL }}</a></p>
          </td></tr>
          <tr><td style="padding:0 32px 24px;text-align:right;border-top:1px solid #E7E7EC;">
            <p style="margin:16px 0 0;font-size:12px;line-height:1.6;color:#71717A;">إذا لم تكن تتوقع هذه الدعوة، يمكنك تجاهل هذه الرسالة بأمان.</p>
          </td></tr>
        </table>
        <p style="margin:16px 0 0;font-size:12px;color:#A1A1AA;font-family:'Segoe UI','Tahoma',Arial,sans-serif;">دعوة إلى Haseeela.</p>
      </td></tr>
    </table>
  </body>
</html>
```

---

## 3. Magic Link / OTP — رابط الدخول السريع ورمز التحقق

**Subject:** `رابط الدخول إلى Haseeela`
**Variables:** `{{ .ConfirmationURL }}`, `{{ .Token }}`

```html
<!doctype html>
<html lang="ar" dir="rtl">
  <body style="margin:0;padding:0;background:#F4F4F6;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">رابط ورمز الدخول إلى حسابك في Haseeela.</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F4F6;padding:32px 12px;">
      <tr><td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="width:560px;max-width:100%;background:#FFFFFF;border:1px solid #E7E7EC;border-radius:16px;overflow:hidden;font-family:'Segoe UI','Tahoma',Arial,sans-serif;">
          <tr><td style="padding:28px 32px 0;text-align:right;"><span style="font-size:20px;font-weight:700;color:#6D5EFC;direction:ltr;unicode-bidi:isolate;">Haseeela</span></td></tr>
          <tr><td style="padding:18px 32px 6px;text-align:right;"><h1 style="margin:0;font-size:22px;line-height:1.4;color:#18181B;">تسجيل الدخول إلى Haseeela</h1></td></tr>
          <tr><td style="padding:6px 32px 0;text-align:right;">
            <p style="margin:0 0 14px;font-size:15px;line-height:1.7;color:#18181B;">اضغط على الزر للدخول مباشرةً، أو استخدم رمز التحقق أدناه.</p>
          </td></tr>
          <tr><td style="padding:8px 32px 4px;text-align:right;">
            <table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="border-radius:10px;background:#6D5EFC;">
              <a href="{{ .ConfirmationURL }}" target="_blank" style="display:inline-block;padding:13px 26px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;border:1px solid #5B4FE0;">تسجيل الدخول إلى Haseeela</a>
            </td></tr></table>
          </td></tr>
          <tr><td style="padding:18px 32px 0;text-align:right;">
            <p style="margin:0 0 8px;font-size:13px;color:#71717A;">رمز التحقق:</p>
            <p style="margin:0 0 16px;direction:ltr;text-align:center;"><span style="display:inline-block;font-size:26px;font-weight:700;letter-spacing:6px;color:#18181B;background:#F4F4F6;border:1px solid #E7E7EC;border-radius:10px;padding:10px 18px;font-family:'Courier New',monospace;">{{ .Token }}</span></p>
          </td></tr>
          <tr><td style="padding:0 32px 0;text-align:right;">
            <p style="margin:0 0 6px;font-size:13px;color:#71717A;">أو انسخ هذا الرابط:</p>
            <p style="margin:0 0 18px;font-size:13px;line-height:1.5;word-break:break-all;direction:ltr;text-align:left;"><a href="{{ .ConfirmationURL }}" style="color:#5B4FE0;text-decoration:underline;">{{ .ConfirmationURL }}</a></p>
          </td></tr>
          <tr><td style="padding:0 32px 24px;text-align:right;border-top:1px solid #E7E7EC;">
            <p style="margin:16px 0 0;font-size:12px;line-height:1.6;color:#71717A;">إذا لم تطلب تسجيل الدخول، تجاهل هذه الرسالة. لا تشارك هذا الرمز مع أي أحد.</p>
          </td></tr>
        </table>
        <p style="margin:16px 0 0;font-size:12px;color:#A1A1AA;font-family:'Segoe UI','Tahoma',Arial,sans-serif;">طلب تسجيل دخول إلى Haseeela.</p>
      </td></tr>
    </table>
  </body>
</html>
```

---

## 4. Change Email Address — تغيير البريد الإلكتروني

**Subject:** `أكّد تغيير بريدك الإلكتروني في Haseeela`
**Variables:** `{{ .Email }}`, `{{ .NewEmail }}`, `{{ .ConfirmationURL }}`
**Note:** With Secure email change ON, this is sent to **both** the current and new address; the recipient must confirm from **both** to complete the change.

```html
<!doctype html>
<html lang="ar" dir="rtl">
  <body style="margin:0;padding:0;background:#F4F4F6;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">أكّد تغيير البريد الإلكتروني لحسابك في Haseeela.</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F4F6;padding:32px 12px;">
      <tr><td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="width:560px;max-width:100%;background:#FFFFFF;border:1px solid #E7E7EC;border-radius:16px;overflow:hidden;font-family:'Segoe UI','Tahoma',Arial,sans-serif;">
          <tr><td style="padding:28px 32px 0;text-align:right;"><span style="font-size:20px;font-weight:700;color:#6D5EFC;direction:ltr;unicode-bidi:isolate;">Haseeela</span></td></tr>
          <tr><td style="padding:18px 32px 6px;text-align:right;"><h1 style="margin:0;font-size:22px;line-height:1.4;color:#18181B;">تأكيد تغيير البريد الإلكتروني</h1></td></tr>
          <tr><td style="padding:6px 32px 0;text-align:right;">
            <p style="margin:0 0 14px;font-size:15px;line-height:1.7;color:#18181B;">طلبت تغيير بريد حسابك من <span style="direction:ltr;unicode-bidi:isolate;font-weight:600;">{{ .Email }}</span> إلى <span style="direction:ltr;unicode-bidi:isolate;font-weight:600;">{{ .NewEmail }}</span>.</p>
            <p style="margin:0 0 14px;font-size:14px;line-height:1.7;color:#71717A;">لأمانك، يجب تأكيد هذا التغيير من بريدك الحالي والبريد الجديد معًا. اضغط الزر في كلتا الرسالتين لإتمام التغيير.</p>
          </td></tr>
          <tr><td style="padding:8px 32px 4px;text-align:right;">
            <table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="border-radius:10px;background:#6D5EFC;">
              <a href="{{ .ConfirmationURL }}" target="_blank" style="display:inline-block;padding:13px 26px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;border:1px solid #5B4FE0;">تأكيد تغيير البريد</a>
            </td></tr></table>
          </td></tr>
          <tr><td style="padding:16px 32px 0;text-align:right;">
            <p style="margin:0 0 6px;font-size:13px;color:#71717A;">أو انسخ هذا الرابط:</p>
            <p style="margin:0 0 18px;font-size:13px;line-height:1.5;word-break:break-all;direction:ltr;text-align:left;"><a href="{{ .ConfirmationURL }}" style="color:#5B4FE0;text-decoration:underline;">{{ .ConfirmationURL }}</a></p>
          </td></tr>
          <tr><td style="padding:0 32px 24px;text-align:right;border-top:1px solid #E7E7EC;">
            <p style="margin:16px 0 0;font-size:12px;line-height:1.6;color:#71717A;">إذا لم تطلب هذا التغيير، تجاهل هذه الرسالة ولن يتغيّر بريدك.</p>
          </td></tr>
        </table>
        <p style="margin:16px 0 0;font-size:12px;color:#A1A1AA;font-family:'Segoe UI','Tahoma',Arial,sans-serif;">طلب تغيير بريد في Haseeela.</p>
      </td></tr>
    </table>
  </body>
</html>
```

---

## 5. Reset Password — إعادة تعيين كلمة المرور

**Subject:** `إعادة تعيين كلمة المرور في Haseeela`
**Variables:** `{{ .ConfirmationURL }}`, `{{ .Email }}`
**Important:** `{{ .ConfirmationURL }}` must route to the app's **`…/reset-password`** page (the app passes `redirect_to=…/reset-password`). Keep it in Redirect URLs.

```html
<!doctype html>
<html lang="ar" dir="rtl">
  <body style="margin:0;padding:0;background:#F4F4F6;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">أعد تعيين كلمة المرور لحسابك في Haseeela.</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F4F6;padding:32px 12px;">
      <tr><td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="width:560px;max-width:100%;background:#FFFFFF;border:1px solid #E7E7EC;border-radius:16px;overflow:hidden;font-family:'Segoe UI','Tahoma',Arial,sans-serif;">
          <tr><td style="padding:28px 32px 0;text-align:right;"><span style="font-size:20px;font-weight:700;color:#6D5EFC;direction:ltr;unicode-bidi:isolate;">Haseeela</span></td></tr>
          <tr><td style="padding:18px 32px 6px;text-align:right;"><h1 style="margin:0;font-size:22px;line-height:1.4;color:#18181B;">إعادة تعيين كلمة المرور</h1></td></tr>
          <tr><td style="padding:6px 32px 0;text-align:right;">
            <p style="margin:0 0 14px;font-size:15px;line-height:1.7;color:#18181B;">تلقّينا طلبًا لإعادة تعيين كلمة المرور للحساب <span style="direction:ltr;unicode-bidi:isolate;font-weight:600;">{{ .Email }}</span>. اضغط الزر لتعيين كلمة مرور جديدة.</p>
          </td></tr>
          <tr><td style="padding:8px 32px 4px;text-align:right;">
            <table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="border-radius:10px;background:#6D5EFC;">
              <a href="{{ .ConfirmationURL }}" target="_blank" style="display:inline-block;padding:13px 26px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;border:1px solid #5B4FE0;">تعيين كلمة مرور جديدة</a>
            </td></tr></table>
          </td></tr>
          <tr><td style="padding:16px 32px 0;text-align:right;">
            <p style="margin:0 0 6px;font-size:13px;color:#71717A;">أو انسخ هذا الرابط:</p>
            <p style="margin:0 0 18px;font-size:13px;line-height:1.5;word-break:break-all;direction:ltr;text-align:left;"><a href="{{ .ConfirmationURL }}" style="color:#5B4FE0;text-decoration:underline;">{{ .ConfirmationURL }}</a></p>
          </td></tr>
          <tr><td style="padding:0 32px 24px;text-align:right;border-top:1px solid #E7E7EC;">
            <p style="margin:16px 0 0;font-size:12px;line-height:1.6;color:#71717A;">إذا لم تطلب ذلك، تجاهل هذه الرسالة وستظل كلمة مرورك كما هي. الرابط صالح لفترة محدودة.</p>
          </td></tr>
        </table>
        <p style="margin:16px 0 0;font-size:12px;color:#A1A1AA;font-family:'Segoe UI','Tahoma',Arial,sans-serif;">طلب إعادة تعيين كلمة المرور في Haseeela.</p>
      </td></tr>
    </table>
  </body>
</html>
```

---

## 6. Reauthentication — رمز إعادة المصادقة

**Subject:** `رمز التحقق لتأكيد هويتك في Haseeela`
**Variables:** `{{ .Token }}` (OTP only — no ConfirmationURL for this type)

```html
<!doctype html>
<html lang="ar" dir="rtl">
  <body style="margin:0;padding:0;background:#F4F4F6;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">رمز التحقق لتأكيد هويتك في Haseeela.</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F4F6;padding:32px 12px;">
      <tr><td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="width:560px;max-width:100%;background:#FFFFFF;border:1px solid #E7E7EC;border-radius:16px;overflow:hidden;font-family:'Segoe UI','Tahoma',Arial,sans-serif;">
          <tr><td style="padding:28px 32px 0;text-align:right;"><span style="font-size:20px;font-weight:700;color:#6D5EFC;direction:ltr;unicode-bidi:isolate;">Haseeela</span></td></tr>
          <tr><td style="padding:18px 32px 6px;text-align:right;"><h1 style="margin:0;font-size:22px;line-height:1.4;color:#18181B;">تأكيد هويتك</h1></td></tr>
          <tr><td style="padding:6px 32px 0;text-align:right;">
            <p style="margin:0 0 14px;font-size:15px;line-height:1.7;color:#18181B;">استخدم رمز التحقق التالي لتأكيد هذا الإجراء:</p>
          </td></tr>
          <tr><td style="padding:4px 32px 0;text-align:right;">
            <p style="margin:0 0 16px;direction:ltr;text-align:center;"><span style="display:inline-block;font-size:26px;font-weight:700;letter-spacing:6px;color:#18181B;background:#F4F4F6;border:1px solid #E7E7EC;border-radius:10px;padding:10px 18px;font-family:'Courier New',monospace;">{{ .Token }}</span></p>
          </td></tr>
          <tr><td style="padding:0 32px 24px;text-align:right;border-top:1px solid #E7E7EC;">
            <p style="margin:16px 0 0;font-size:12px;line-height:1.6;color:#71717A;">إذا لم تطلب هذا الإجراء، تجاهل هذه الرسالة ولا تشارك الرمز مع أي أحد.</p>
          </td></tr>
        </table>
        <p style="margin:16px 0 0;font-size:12px;color:#A1A1AA;font-family:'Segoe UI','Tahoma',Arial,sans-serif;">طلب تأكيد هوية في Haseeela.</p>
      </td></tr>
    </table>
  </body>
</html>
```

---

## Dashboard paste checklist
- [ ] **Confirm sign up** → subject + Template 1
- [ ] **Invite user** → subject + Template 2
- [ ] **Magic Link** → subject + Template 3
- [ ] **Change Email Address** → subject + Template 4
- [ ] **Reset Password** → subject + Template 5
- [ ] **Reauthentication** → subject + Template 6
- [ ] **Redirect URLs include** `…/verify` and `…/reset-password` (prod + localhost).
- [ ] **Secure email change**: ENABLED (kept on per owner's decision).
- [ ] Sent a real test of each; confirmed links work and variables resolved (no literal `{{ … }}` in the received email).
- [ ] Checked rendering in Gmail, Apple Mail, Outlook (RTL + button + token).

## Notes
- Only the variables listed per template are guaranteed for that type — don't add `{{ .NewEmail }}` outside Change Email, etc.
- If you use a **custom SMTP** sender, set a recognizable From name/address for deliverability; never expose SMTP credentials.
- These templates intentionally mirror the English set's structure so both languages stay visually consistent.
