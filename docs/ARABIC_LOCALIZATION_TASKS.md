# Haseeela — Bilingual (EN + AR) Localization Task Breakdown

> **This is bilingual, not Arabic replacement.** Every screen task means: **move the existing English copy into `messages/en.ts`, add the Arabic counterpart in `messages/ar.ts`, and render via `t('key')`.** Never hardcode Arabic (or English) in components. Never delete English. Build for more languages later.
> For the **Gemini 3.1 Pro** implementer. Work **top to bottom**, in small reviewable commits.
> Mark `Status` as you go: `☐ todo` → `◐ in-progress` → `☑ done` (and mirror it in [`ARABIC_LOCALIZATION_PROGRESS.md`](./ARABIC_LOCALIZATION_PROGRESS.md)).
> Read [`GEMINI_ARABIC_LOCALIZATION_INSTRUCTIONS.md`](./GEMINI_ARABIC_LOCALIZATION_INSTRUCTIONS.md) and [`ARABIC_TERMINOLOGY.md`](./ARABIC_TERMINOLOGY.md) **before** starting.
>
> **Definition of "localize a screen" (applies to every Group 1–7 task):** (1) extract each visible string to a stable key in `en.ts` with its current English value; (2) add the Arabic value in `ar.ts`; (3) replace the literal in the component with `t('key')`; (4) verify the screen in **both** EN (LTR) and AR (RTL).

Legend — **Status:** ☐ todo · ◐ in-progress · ☑ done · ⚠ blocked/needs-reviewer.

---

## Group 0 — Foundation (do FIRST; nothing else lands cleanly without it)

| ID | Area | Files likely involved | What to do | RTL / layout notes | Acceptance criteria | Status |
|---|---|---|---|---|---|---|
| T-00a | Locale config | `src/lib/locales.ts` | Central config: `Locale` union (`'en'\|'ar'`), `DEFAULT_LOCALE='en'`, `LOCALES` map (label, nativeLabel, `dir`, `intl` tag), `SUPPORTED_LOCALES`, `isLocale()`, `dirFor()`, `intlTagFor()`. Built to extend (add a key → new language). | — | Type-safe config; adding a locale is one entry. | ☐ |
| T-00b | i18n layer | `src/messages/en.ts`, `src/messages/ar.ts`, `src/messages/index.ts`, `src/lib/i18n.ts` | `en.ts` = **base/source of truth** (typed `Messages = typeof en`); `ar.ts` typed `: Messages` (mirrors keys). `index.ts` registry + `getMessages(locale)` + server `t(locale,key,vars)`. `i18n.ts`: `LocaleProvider`, `useLocale()` → `{ locale, dir, t, setLocale }`, interpolation, **fallback** (active → en → key), dev-only missing-key `console.warn`. | Provider exposes `{ locale, dir, t, setLocale }`. | Typecheck clean; `t('common.actions.save')` works in en+ar; missing key falls back to en then key; no crash. | ☐ |
| T-00c | Key-parity script | `scripts/i18n-check.ts`, `package.json` | Script that diffs every locale's keys vs `en.ts`; fails on missing/extra/duplicated keys. Wire into CI / a `lint:i18n` npm script. | — | Running it on aligned files passes; on a deliberately missing key, fails. | ☐ |
| T-00d | **Language toggle + persistence** | `components/ui/LanguageToggle.tsx`, `components/Sidebar.tsx`, `components/AppShell.tsx`/`Drawer.tsx`, `app/settings/page.tsx`, `components/layout/AuthLayout.tsx`/`AuthHeader.tsx` | Build one accessible `LanguageToggle` (segmented `EN \| ع` or "other language" button, `aria-label`, keyboard). Wire into **sidebar bottom**, **mobile drawer**, **Settings → Workspace**, **auth header**. Persist to `localStorage['haseeela.locale']`; `setLocale` updates provider + storage + `document.documentElement.lang/dir`. | Toggle itself must be reachable in both dirs; icon+tooltip when sidebar collapsed. | Switching EN↔AR live updates copy + direction; persists across reload/navigation; works logged-out. | ☐ |
| T-01 | Direction, no-flash & fonts | `app/layout.tsx`, `globals.css` | SSR `<html lang={DEFAULT_LOCALE} dir="ltr">`. Add a **pre-paint no-flash script** (mirror of `themeNoFlashScript`) that sets `lang`/`dir` from `localStorage` before paint. Add an **Arabic webfont** (Cairo/Tajawal/IBM Plex Sans Arabic/Noto Sans Arabic) **alongside Inter** (Latin kept for EN + digits/codes). Localize `metadata` + manifest via dictionary (default locale). | No flash of LTR when stored locale is AR; EN unchanged. | Reload in AR → no flash; EN visually identical to today; build OK. | ☐ |
| T-02 | Locale-aware formatting | `src/lib/format.ts`, replace 17 `toLocaleDateString('en-US'…)`/`Intl` call sites (esp. `lib/currency.ts`, `app/reports/page.tsx`, `app/clients/page.tsx`, `server/reports.ts`) | Central date/number/currency helpers keyed to `intlTagFor(locale)`: **Latin digits in both**, locale month names; currency on Latin-digit formatter; LTR-wrap helper for tokens. | Amounts/codes LTR in both; EN dates unchanged, AR dates Arabic months. | All formatting flows through `lib/format.ts`; EN parity preserved. | ☐ |
| T-03 | RTL utility sweep (shared, direction-agnostic) | `components/ui/*`, `components/AppShell.tsx`, `components/ui/Drawer.tsx` | Convert hard `ml/mr/pl/pr/left/right/text-left/right/rounded-l/r` to logical (`ms/me/ps/pe/start/end/text-start/end/rounded-s/e`); make drawer slide direction-aware. **Same markup must render correctly in BOTH directions** (not Arabic-only). | Unblocks every screen's mirroring; verify EN still looks identical. | Shared components correct in EN (LTR) **and** AR (RTL) smoke test. | ☐ |

---

## Group 1 — Navigation & shell

| ID | Area | Files | What to translate | RTL notes | Acceptance | Status |
|---|---|---|---|---|---|---|
| T-10 | Sidebar | `components/Sidebar.tsx` | Nav labels (Overview, Transactions, Invoices, Clients & Revenue, Subscriptions, Analytics, Reports, Archive, Settings); user menu (Profile, Settings, Light/Dark mode, Log out). | Active indicator → logical edge; collapse chevron rotation flips; icon slot mirrors. | All labels Arabic; rail + indicator mirror; collapse works. | ☐ |
| T-11 | Topbar | `components/Topbar.tsx` | Search placeholder, "New" button + menu, notifications aria-label. | Search icon & menu anchor mirror to start/end. | Arabic; menu opens correct edge. | ☐ |
| T-12 | Command palette | `components/CommandPalette.tsx` | Placeholder, group headings, action labels, empty result text. | Input + results mirror. | Arabic; keyboard nav intact. | ☐ |

---

## Group 2 — Auth & onboarding

| ID | Area | Files | What to translate | RTL notes | Acceptance | Status |
|---|---|---|---|---|---|---|
| T-20 | Login | `app/login/page.tsx`, `components/auth/AuthHeader.tsx`, `components/layout/AuthLayout.tsx` | Titles, labels, placeholders, buttons, "forgot password", error/notice copy (incl. `?expired=1`). | Form alignment start; password reveal icon mirrors. | Arabic; sign-in works. | ☐ |
| T-21 | Register | `app/register/page.tsx`, `components/auth/PasswordInput.tsx` | Titles, labels, strength meter text, terms/links, buttons, validation. | As above. | Arabic; register works. | ☐ |
| T-22 | Forgot password | `app/forgot-password/page.tsx` | Heading, body, input, button, success/rate-limit copy. | — | Arabic; email sends. | ☐ |
| T-23 | Reset password | `app/reset-password/page.tsx` | Heading, fields, strength, buttons, invalid/expired link copy. | — | Arabic; reset works; recovery token handling unchanged. | ☐ |
| T-24 | Verify email | `app/verify/page.tsx` | "Confirming…", success ("Email confirmed"), **email-changed ("Email updated")**, invalid/expired copy, CTAs. | — | Arabic; **do not change** token/`email_change`/`refreshSession` logic. | ☐ |
| T-25 | Onboarding | `app/onboarding/page.tsx`, `lib/onboarding.ts` (display strings only) | Steps, prompts, currency picker labels, CTA. | Stepper mirrors. | Arabic; onboarding completes. | ☐ |

---

## Group 3 — Core pages

| ID | Area | Files | What to translate | RTL notes | Acceptance | Status |
|---|---|---|---|---|---|---|
| T-30 | Dashboard/Overview | `app/page.tsx` | Section headers, stat-card labels, empty/loading states, quick actions, recent activity. | Stat cards & dividers mirror; amounts LTR. | Arabic; data renders. | ☐ |
| T-31 | Transactions | `app/transactions/page.tsx`, `components/modals/EntityModals.tsx` | Page header, filters, table headers, status badges, "Add revenue"/"Log expense" modals, **category option labels** (display only), validation, toasts, empty state. | Table + filter alignment; amounts LTR; modal close mirrors. | Arabic; create/edit/delete work; enum/category **codes** unchanged. | ☐ |
| T-32 | Clients & Revenue | `app/clients/page.tsx` | Header, stat cards (Active/Retainers/Recorded revenue/Archived), "Add client", segmented (Active/Include archived), card copy (One-time/Retainer, "total paid", "payment …", "No payments recorded yet"), record-payment, archive confirm, revenue overview / top client, validation, toasts. | Cards/segmented mirror; amounts LTR. | Arabic; one-time + retainer flows unaffected. | ☐ |
| T-33 | Subscriptions | `app/subscriptions/page.tsx` | Header, stat cards, add/edit modal, cycle labels (Monthly/Quarterly/Yearly **display**), record payment, archive, toasts, empty state. | Mirror; amounts LTR. | Arabic; cycle **enum codes** unchanged. | ☐ |
| T-34 | Analytics | `app/analytics/page.tsx`, `components/charts/AnalyticsCharts.tsx`, `ClientRevenuePieChart.tsx`, `DashboardMonthlyChart.tsx` | Headers, metric labels, legends, axis labels, tooltips, empty states. | Recharts RTL: configure axis/legend; numbers LTR; document limits. | Arabic; charts render; note any chart RTL limitation. | ☐ |
| T-35 | Archive | `app/archive/page.tsx` | Header, tabs (Clients/Subscriptions), restore / delete-permanently labels, two-step confirm copy, empty states, toasts. | Mirror; destructive confirm clear. | Arabic; restore/permanent-delete work. | ☐ |
| T-36 | Notifications | `app/notifications/page.tsx`, `server/notifications.ts` | UI: header, mark-read, empty state. Server: generated notification titles/messages (billing reminders, invoice due, weekly summary). | List items mirror; dates Arabic. | Arabic; generation logic unchanged (only strings). | ☐ |
| T-37 | Profile | `app/profile/page.tsx` | Headers, fields, **email-change hint + the both-inboxes banner**, password change, delete-account modal, toasts, validation. | Mirror; current-password field flows. | Arabic; email/password/delete flows unchanged. | ☐ |
| T-38 | Settings | `app/settings/page.tsx` | Account, Workspace (currency hint, accounting mode), Appearance (System/Light/Dark), Notifications toggles + hints. | Toggles/segmented mirror. | Arabic; preferences persist. | ☐ |
| T-39 | Offline | `app/offline/page.tsx` | Offline message + retry. | — | Arabic. | ☐ |

---

## Group 4 — Invoices (UI)

| ID | Area | Files | What to translate | RTL notes | Acceptance | Status |
|---|---|---|---|---|---|---|
| T-40 | Invoices list | `app/invoices/page.tsx` | Header, filters, table headers, status badges (Draft/Sent/Paid/Overdue **display**), row actions, empty state, toasts. | Table mirror; invoice numbers + amounts LTR. | Arabic; status **enum codes** unchanged. | ☐ |
| T-41 | Invoice editor | `app/invoices/new/page.tsx`, `app/invoices/[id]/edit/page.tsx`, `components/invoices/InvoiceEditor.tsx` | Field labels (number/client/issue date/due date/currency/tax/discount/notes/terms/line items), buttons (Save draft / Create & send), validation, line-item add/remove. | Line-item table mirror; numbers/currency LTR. | Arabic; create/edit + totals correct. | ☐ |
| T-42 | Invoice detail | `app/invoices/[id]/page.tsx`, `components/invoices/InvoiceDocument.tsx` | Labels (Bill to, totals, status, dates), actions (Download PDF, Print, Send, Mark paid, Edit, Delete). | Document mirror; **keep invoice number/dates/amounts LTR** islands. | Arabic; actions work. | ☐ |
| T-43 | Send invoice modal | `components/invoices/SendInvoiceModal.tsx` | Recipient label, message field, send button, loading/success/error states, fallback (Download PDF / Open mail app) copy. | Mirror; email field LTR. | Arabic; SMTP flow + "Sent only on success" unchanged. | ☐ |

---

## Group 5 — Reports & exports

| ID | Area | Files | What to translate | RTL notes | Acceptance | Status |
|---|---|---|---|---|---|---|
| T-50 | Reports UI | `app/reports/page.tsx` | Report-type cards (P&L/Transactions/Client Revenue/Tax) + descriptions, period presets (Month/Quarter/Year/All time), From/To, buttons (Print/PDF, CSV, Excel), summary labels, table headers, empty/loading, toasts, **print letterhead** copy. | Print path is HTML → set `dir`; table mirror; amounts LTR. | Arabic; report renders + prints RTL. | ☐ |
| T-51 | Report data labels | `server/reports.ts` | `REPORT_TITLES`, column `label`s, summary `label`s, `CATEGORY_LABELS` Arabic values. **Keep keys/codes/enum English.** | — | Arabic labels in JSON/CSV/XLSX; codes unchanged; tests pass. | ☐ |
| T-52 | Excel export (per UI language) | `server/reportXlsx.ts`, `app/api/reports/route.ts` | Localize "Generated …", "Total", and (via T-51) column/summary labels from `messages/<locale>`. Client passes `locale` query param to `/api/reports` (validated, default `en`). Brand "Haseeela" stays. | When locale is RTL, optionally set sheet `views[].rightToLeft = true`; **keep numeric cells numeric**. | Valid `.xlsx` in EN + AR; localized headers; sums/sorting intact. | ☐ |

---

## Group 6 — Emails & PDF (server-generated)

| ID | Area | Files | What to translate | Notes | Acceptance | Status |
|---|---|---|---|---|---|---|
| T-EM-01 | Invoice email body (bilingual) | `app/api/invoices/[id]/send/route.ts`, `server/emailTemplate.ts` | Pull subject/greeting/intro/detail-row labels from `messages/<locale>` via server `t`. Accept a validated `locale` in the request body (sender's UI language; default `en`, `isLocale()` guard). | `renderBrandedEmail` becomes **direction-aware** (`dir` per locale, `align` per cell). EN output unchanged vs today. Preserve SMTP + attachment + "Sent only on success". | EN + AR invoice email render in Gmail/Apple Mail/Outlook; PDF attaches; secrets safe. | ☐ |
| T-EM-02 | Supabase auth emails (per-language) | `docs/SUPABASE_AUTH_EMAIL_TEMPLATES.md` (EN), `docs/SUPABASE_AUTH_EMAIL_TEMPLATES_AR.md` (AR) + manual dashboard paste | Confirm both EN and AR templates for all 6 types. **Supabase can't branch by user locale** → choose **bilingual stacked** templates (recommended) or a primary language; document the choice. **Never** alter `{{ … }}`. | Dashboard-only; not app code. | Chosen approach pasted; variables intact; links work in both. | ☐ |
| T-PDF-01 | Invoice PDF Arabic | `server/invoicePdf.ts` (+ maybe `@pdf-lib/fontkit`, `arabic-reshaper`, bidi, a TTF asset) | **Decision task first.** **English PDF must keep working unchanged.** For Arabic: either (a) embed Arabic TTF + shape/bidi text, or (b) interim — Arabic invoices still emit the **English** PDF (documented) until (a) ships. Do NOT pass raw Arabic to the WinAnsi `sanitize()`. | 🔴 Highest-risk task — needs reviewer sign-off before coding. | EN PDF identical to today; Arabic approach renders OR interim documented; PDF never crashes; numbers Latin. | ⚠ |
| T-PDF-02 | Report print/PDF | `app/reports/page.tsx` (print CSS) | Covered by T-50 (HTML print). Ensure `dir`/labels in printout. | HTML print supports Arabic natively. | Printed report RTL + Arabic. | ☐ |

---

## Group 7 — Server micro-copy, errors, validation

| ID | Area | Files | What to translate | Notes | Acceptance | Status |
|---|---|---|---|---|---|---|
| T-70 | API error messages | `server/errors.ts`, `app/api/**` `HttpError` messages | User-facing error strings surfaced in toasts (e.g. "Client not found", "Only active clients can record…"). Map to Arabic via dictionary, OR translate the thrown display message. **Keep HTTP status codes & control flow identical.** | Prefer a client-side error dictionary keyed by code to avoid churning server logic; coordinate with reviewer. | Arabic errors shown; behavior/status unchanged; tests pass. | ☐ |
| T-71 | Validation messages | `server/validation.ts`, form-level checks in pages/modals | Zod/user messages shown to users ("Add at least one line item", "Name and a positive amount are required."). | Keep schema/field keys English. | Arabic validation copy; schemas unchanged. | ☐ |
| T-72 | Auto transaction names | `server/recurring-billing.ts`, `server/linked-transactions.ts` | Display names like "… retainer payment", "… one-time payment", "… subscription payment" (these appear in tables/reports). | ⚠ These are persisted to the DB `name` field. Decide: translate **at display time** (preferred, non-destructive) vs. at write time. Coordinate with reviewer; don't break the deterministic-id logic or the `@@unique` constraints. | Arabic display without breaking existing rows or id logic. | ⚠ |

---

## Group 8 — Tests, docs, final

| ID | Area | Files | What to do | Acceptance | Status |
|---|---|---|---|---|---|
| T-80 | Test alignment (bilingual) | `src/**/*.test.ts(x)` | Prefer asserting via keys/test-ids/behavior. For copy assertions, render under a known `LocaleProvider` locale. Add a couple of i18n tests (fallback to en; `dir` per locale). Run `scripts/i18n-check.ts`. **Do not delete tests.** | `npx jest` green; i18n-check passes. | ☐ |
| T-81 | Typecheck/build gates | — | Run `npx tsc --noEmit` and `npm run build` after each group. | Both clean. | ☐ |
| T-82 | Progress & reviewer notes | `docs/ARABIC_LOCALIZATION_PROGRESS.md` | Keep updated continuously: files changed, strings done, RTL changes, emails/PDF/exports, issues, questions, remaining work. | Doc reflects reality at handoff. | ☐ |
| T-83 | Dictionary parity upkeep | `src/messages/*.ts` | `en.ts` is the base; every key added there must be added to `ar.ts` (and any future locale). Run `i18n-check` + `tsc`. | Keys match across all locale files; no drift. | ☐ |

---

### Suggested order
T-00a → T-00b → T-00c → T-00d → T-01 → T-02 → T-03 → Group 1 → Group 2 → Group 3 → Group 4 → Group 5 → T-EM-01 → T-70/71 → (T-PDF-01 decision) → T-EM-02 → Group 8.

> After T-00a–T-03 you have a working bilingual shell (toggle + EN/AR dictionaries + formatting + direction). From there, each screen task just extracts copy to keys and adds the Arabic value.

### Reviewer checkpoints (Claude)
After **Group 0**, after **Group 3**, after **Group 5/6**, and at **final handoff** — run the §11 reviewer process from the Plan.
