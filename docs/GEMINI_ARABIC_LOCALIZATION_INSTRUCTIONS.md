# Instructions for the Gemini 3.1 Pro Implementation Agent — Arabic Localization of Haseeela

> **You are the implementer.** A separate reviewer (Claude) wrote the plan and will review your work.
> **Read these first, in order:** [`ARABIC_LOCALIZATION_PLAN.md`](./ARABIC_LOCALIZATION_PLAN.md) → [`ARABIC_TERMINOLOGY.md`](./ARABIC_TERMINOLOGY.md) → [`ARABIC_LOCALIZATION_TASKS.md`](./ARABIC_LOCALIZATION_TASKS.md). Track everything in [`ARABIC_LOCALIZATION_PROGRESS.md`](./ARABIC_LOCALIZATION_PROGRESS.md).
> **App location:** `apps/web/` (Next.js 14 App Router, TypeScript, Tailwind 3.4, Prisma, Supabase). Run all commands from `apps/web/`.

---

## 0. The one-paragraph brief
Make Haseeela **fully bilingual (English + Arabic)** with a **visible, persistent language toggle** — **not** an Arabic replacement. English stays fully available; Arabic is **added**. Every user-visible string moves into a **typed dictionary** (`src/messages/en.ts` base + `src/messages/ar.ts`) and is rendered via **stable keys** `t('area.thing')` — never hardcoded in either language. A central `src/lib/locales.ts` config + `src/lib/i18n.ts` provider drive `lang`/`dir` per locale and make adding more languages later a small, mechanical change. Do **not** add `next-intl` or any heavy framework. Do **not** change business logic, DB schema, auth/security, invoice SMTP behavior, routes, enums, or env vars. Work in **small, reviewable steps**, run `tsc`/tests/`i18n-check` frequently, and keep the progress doc current.

> **This is a bilingual, future-extensible i18n system, not Arabic-only.** The structure must allow `fr`, `es`, … later by adding a message file + a locale-config entry — with **zero component changes**.

---

## 1. You MUST
- **Keep the app bilingual.** English stays fully available; Arabic is **added**. Both `en.ts` and `ar.ts` must define **every** key.
- **Use stable translation keys** for **all** user-facing copy: `t('dashboard.title')`, `t('invoices.send')`, `t('auth.resetPassword.title')`. No hardcoded English **or** Arabic in components.
- **Build the language toggle** (accessible, visible, persistent) and wire it into sidebar bottom + mobile drawer + Settings + auth header.
- **Drive `lang`/`dir` from the active locale** (`en→ltr`, `ar→rtl`) via `lib/locales.ts`; keep direction work direction-agnostic (logical CSS), not Arabic-special-cased.
- **Implement fallback**: missing key → English → key text; **dev-only** warn; **never crash production**.
- **Keep dictionaries type-aligned**: `en.ts` is the base type; `ar.ts` typed against it; run `scripts/i18n-check.ts`.
- **Follow the glossary** ([`ARABIC_TERMINOLOGY.md`](./ARABIC_TERMINOLOGY.md)) exactly for the Arabic values.
- **Route only user-facing strings through `t()`**: visible text, button labels, placeholders, `aria-label`, `title`, `alt`, headings, descriptions, empty states, toasts, success/error messages, validation messages, modal/dialog copy, table headers, filter labels, badges, tooltips, metadata, manifest.
- **Preserve business logic** and control flow exactly.
- **Preserve internal identifiers**: DB/table/column names, API JSON field names, enum values, route paths, env var names, Prisma identifiers, test IDs, CSS class names, package names, deterministic IDs (`auto-client-onetime-…`).
- **Preserve Supabase variables** verbatim: `{{ .ConfirmationURL }}`, `{{ .Token }}`, `{{ .Email }}`, `{{ .NewEmail }}`, and any others — exact casing/spacing.
- **Preserve invoice sending behavior**: SMTP flow, "mark **Sent** only on success," PDF attachment, fallbacks.
- **Preserve auth/security behavior**: token handling, `email_change` flow, `refreshSession`, session/redirect logic in `app/verify/page.tsx`, `reset-password`, middleware (if any).
- **Preserve tests** — only update assertions for copy that is *intentionally* becoming Arabic; prefer asserting via keys/test-ids/behavior. Never delete a test.
- **Keep styling/design consistent**; reuse existing components and tokens.
- **Use RTL-safe CSS** (logical Tailwind utilities; see §6).
- **Update the progress doc** after each section, with files changed and reviewer notes for any uncertain translation.

## 2. You MUST NOT
- **Remove or replace English copy** — relocate it into `messages/en.ts`; never drop it.
- **Hardcode** Arabic or English strings in components — always go through `t()`.
- Leave a key defined in one locale but missing in another (breaks parity/types).
- Arabic-special-case layout (hard `rtl:` hacks where a logical utility works) — keep it bilingual.
- Change the **database schema** or run destructive migrations.
- Change **Supabase auth logic** or security behavior.
- Change **invoice SMTP** logic or mark invoices Sent on failure.
- Translate **enum values**, **category codes**, **route paths**, **env var names**, **API field names**, **Supabase variables**, or **Prisma identifiers**.
- Hardcode user data or sample/PII values into UI.
- Commit **secrets** or any `.env*` file.
- Remove tests, remove error handling, or weaken validation.
- Break exports, PDFs, or emails.
- Do massive, unreviewable rewrites or reformat unrelated code.

---

## 3. Implementation approach (do this, in order)

### 3.1 Build the bilingual foundation first (Tasks T-00a…T-03)
1. **`src/lib/locales.ts`** — central config: `Locale = 'en'|'ar'`, `DEFAULT_LOCALE='en'`, `LOCALES` (label, nativeLabel, `dir`, `intl` tag), `SUPPORTED_LOCALES`, `isLocale`, `dirFor`, `intlTagFor`. Adding a language = one entry.
2. **`src/messages/`** — `en.ts` (**base** = today's exact English copy; `Messages = typeof en`), `ar.ts` (typed `: Messages`, Arabic per glossary), `index.ts` (registry `{ en, ar }`, `getMessages(locale)`, server `t(locale,key,vars)`). Keys are dot-namespaced English identifiers; **never** shown.
3. **`src/lib/i18n.ts`** — `LocaleProvider`, `useLocale()` → `{ locale, dir, t, setLocale }`, `{var}` interpolation, **fallback** (active → en → key), **dev-only** missing-key `console.warn`. Initial locale from `localStorage['haseeela.locale']` → default `en`.
4. **`scripts/i18n-check.ts`** + npm script — fail on missing/extra/duplicated keys across locales; wire into CI.
5. **`components/ui/LanguageToggle.tsx`** — accessible toggle (native labels, `aria-label`, keyboard); `setLocale` updates provider + `localStorage` + `document.documentElement.lang/dir`. Wire into **sidebar bottom**, **mobile drawer**, **Settings → Workspace**, **auth header** (one shared component).
6. **`app/layout.tsx` + no-flash** — SSR `<html lang={DEFAULT_LOCALE} dir="ltr">`; add a **pre-paint script** (mirror of `themeNoFlashScript`) that sets `lang`/`dir` from `localStorage` before paint (prevents RTL flash). Add an Arabic webfont (Cairo / Tajawal / IBM Plex Sans Arabic / Noto Sans Arabic) **alongside Inter** (Latin kept for EN + digits/codes); localize `metadata` + `public/manifest.json`.
7. **`src/lib/format.ts`** — locale-aware date/number/currency via `intlTagFor(locale)` (**Latin digits both**, locale month names) + LTR-wrap helper for tokens. Replace the ~17 `toLocaleDateString('en-US'…)`/`Intl` call sites.
8. **Shared RTL sweep (direction-agnostic)** — convert hard `ml/mr/pl/pr/left/right/text-left/right/rounded-l/r` to logical utilities in `components/ui/*` and the shell; make the mobile drawer slide direction-aware. Verify **EN identical to today** and **AR mirrors**.

### 3.2 Then localize screen-by-screen
Follow the task order in [`ARABIC_LOCALIZATION_TASKS.md`](./ARABIC_LOCALIZATION_TASKS.md): navigation → auth → core pages → invoices → reports/exports → emails → server micro-copy → PDF decision → tests.

### 3.3 Cadence & safety
- **Work in small sections** (one task ID per change set).
- Run **`npx tsc --noEmit`** after every change set.
- Run **`npx jest`** after any change that could touch asserted copy or logic, and after each group.
- Run **`npm run build`** at the end of each group.
- Keep changes **minimal and traceable**; do not touch unrelated files.
- **Document changed files** and mark tasks done in the progress doc.
- Leave **reviewer notes** for any translation you're unsure about (don't guess inconsistently — add a glossary row + flag).

---

## 4. Strings: how to find and what to convert

### 4.1 Where to search
- `.tsx` / `.ts` under `apps/web/src/**` (pages, components, hooks).
- Server string sources: `server/emailTemplate.ts`, `app/api/invoices/[id]/send/route.ts`, `server/invoicePdf.ts`, `server/reports.ts`, `server/reportXlsx.ts`, `server/notifications.ts`, `server/recurring-billing.ts`, `server/linked-transactions.ts`, `server/errors.ts`, `server/validation.ts`, and `HttpError(...)` messages across `app/api/**`.
- Metadata: `app/layout.tsx`; PWA: `public/manifest.json`.
- Relevant docs (auth email templates).

### 4.2 Useful search heuristics
Look for human-readable English in: JSX text nodes, `title=`, `label=`, `placeholder=`, `aria-label=`, `alt=`, `description=`, `toast('…')`, `subject:`, `heading:`, `intro:`, `footnote:`, column `label:`, `EmptyState title/body`, `ConfirmDialog`, `InlineAlert title/body`, `throw new HttpError(code, '…')`.

### 4.3 What to convert vs keep
- **Convert:** visible UI text, placeholders, `aria-label`/`title`/`alt`, button/CTA text, empty states, toasts, validation, error messages shown to users, email/PDF/export visible labels (subject to §5/§7), metadata.
- **Keep English:** technical debug logs (`lib/authDebug.ts`, `console.*`) unless shown to the user; URLs/emails/invoice numbers/IDs/currency codes (render **LTR**); all identifiers in §1/§2.

### 4.4 LTR islands
Wrap technical tokens (invoice numbers, emails, URLs, currency codes, IDs, formatted amounts) in `dir="ltr"` + `text-start` so they don't reorder inside RTL text.

---

## 5. Emails

### 5.1 Invoice email (app code, bilingual) — Task T-EM-01
- Files: `app/api/invoices/[id]/send/route.ts`, `server/emailTemplate.ts`.
- Resolve the **sender's language** server-side: accept a validated `locale` in the request body (`isLocale()`, default `en`). Render subject/greeting/intro/detail-row labels from `messages/<locale>` via the server `t`.
- Make `renderBrandedEmail` **direction-aware**: `dir` per locale (`rtl` for ar), `align`/logical per cell, table-based + inline CSS (no external CSS/fonts). **EN output must stay byte-for-byte today's email.**
- Keep invoice number, amounts, dates as **LTR** values in both languages.
- **Preserve**: SMTP send, PDF attachment, "mark Sent only on success," secrets never logged/returned. Test EN + AR in Gmail + Apple Mail + Outlook.

### 5.2 Supabase auth emails (dashboard, per-language) — Task T-EM-02
- **Not** app code; they live in the Supabase Dashboard, and Supabase **can't branch by user locale**.
- Keep **both** docs: English [`SUPABASE_AUTH_EMAIL_TEMPLATES.md`](./SUPABASE_AUTH_EMAIL_TEMPLATES.md) and Arabic [`SUPABASE_AUTH_EMAIL_TEMPLATES_AR.md`](./SUPABASE_AUTH_EMAIL_TEMPLATES_AR.md). Recommended: a **bilingual stacked** template (EN block + AR block) per type, or pick the org's primary language — **document the choice** as a limitation.
- **Never** translate/alter `{{ .ConfirmationURL }}`, `{{ .Token }}`, `{{ .Email }}`, `{{ .NewEmail }}`.
- Keep `…/verify` and `…/reset-password` in **Authentication → URL Configuration → Redirect URLs**.

---

## 6. RTL & styling rules
- Direction is global from `<html dir>`, **derived from the active locale** (`en→ltr`, `ar→rtl`). The same components must render correctly in **both** directions — don't build Arabic-only layouts. Don't sprinkle `dir` per component (except LTR islands).
- Use logical Tailwind utilities: `ms-/me-/ps-/pe-/start-/end-/text-start/text-end/rounded-s-/rounded-e-`. Use `rtl:`/`ltr:` variants only where logical props can't express it (transforms/rotations).
- Mirror: sidebar active indicator, collapse chevron, mobile drawer slide side, menu/dropdown caret & anchor, modal close button, form prefix/suffix (currency).
- Don't mirror: status/finance up-down arrows, brand logo glyph, numeric content.
- Charts (recharts): configure axis side/legend; numbers stay LTR; document any RTL limitation rather than hacking layout.

## 7. PDF & Excel
- **Invoice PDF (T-PDF-01) — STOP and get reviewer sign-off on approach first.** **English PDF must keep working unchanged.** `pdf-lib` standard fonts are WinAnsi and the existing `sanitize()` **strips Arabic**. Do **not** pass raw Arabic to it. Approved options:
  - (a) Embed an Arabic TTF via `@pdf-lib/fontkit` **and** pre-shape text (`arabic-reshaper` + bidi reordering) before `drawText`; keep numbers Latin.
  - (b) Interim: Arabic invoices still emit the **English** PDF (documented) until (a) ships.
  Pick one with the reviewer; never let the PDF crash; numbers stay Latin/LTR.
- **Report print/PDF**: HTML (browser print) — follows current UI language + `dir`; localize labels via `t()`.
- **Excel (T-52)**: headers/labels from `messages/<currentUILocale>` (client passes `locale` to `/api/reports`); **keep numeric cells numeric** (don't stringify); valid `.xlsx` in both languages. When locale is RTL, optionally set the worksheet `views[].rightToLeft = true`.

## 8. Formatting (use `lib/format.ts`)
- Locale-aware via `intlTagFor(locale)`: **Latin digits in both EN and AR**; month names follow the locale (English months in EN, Arabic months in AR); currency codes LTR; keep minus attached to numbers; negatives stay red.
- Don't switch the app to Eastern Arabic numerals.
- EN formatting must remain identical to today.

## 9. Tests
- Prefer behavior/role/test-id assertions. For copy assertions, render under a known `LocaleProvider` locale and assert via the key or that locale's value. Add small i18n tests (fallback active→en→key; `dir` per locale). Run `scripts/i18n-check.ts` (key parity) + `tsc` (type parity). Never delete tests. Keep `npx jest` green.

## 10. Definition of done (per task)
- Every visible string in that area renders via `t()`; **`en.ts` + `ar.ts` both define the keys** (English value = today's copy, Arabic per glossary).
- Area renders correctly in **both** EN (LTR, unchanged from today) and AR (RTL, no overflow/clipping at common widths + mobile).
- Toggling EN↔AR live updates the area's copy + direction.
- `npx tsc --noEmit` clean; `i18n-check` passes; relevant tests pass.
- Internal identifiers, enums, routes, env, Supabase variables untouched; **no English removed**.
- Progress doc updated (files changed, notes, status).

## 11. Handoff to reviewer
When all groups are done:
- Ensure [`ARABIC_LOCALIZATION_PROGRESS.md`](./ARABIC_LOCALIZATION_PROGRESS.md) is complete (files changed, strings done, RTL changes, emails/PDF/exports, issues, questions, remaining work, final summary).
- Run `npx tsc --noEmit`, `npx jest`, `npm run build` and record results.
- List any uncertain translations / RTL limitations / PDF strategy outcome for the reviewer's punch list.
- **Do not deploy.** The reviewer (Claude) will verify and report deployment readiness.
