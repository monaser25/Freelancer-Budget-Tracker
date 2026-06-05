# Haseeela — Bilingual Localization Plan (English + Arabic) (Phase 1)

> **Scope (v2):** Full **bilingual** support — English **and** Arabic — with a visible language toggle, persistence, per-locale `lang`/`dir`, stable translation keys, and an i18n layer **built to add more languages later**. English is the base/source locale; Arabic is added, not a replacement. (Filename kept as `ARABIC_LOCALIZATION_*` for continuity.)
> **Status:** Planning only. No translation has been implemented yet.
> **Owner of this doc:** Localization Lead / Reviewer (Claude).
> **Implementer:** Gemini 3.1 Pro agent — see [`GEMINI_ARABIC_LOCALIZATION_INSTRUCTIONS.md`](./GEMINI_ARABIC_LOCALIZATION_INSTRUCTIONS.md).
> **Companion docs:** [`ARABIC_LOCALIZATION_TASKS.md`](./ARABIC_LOCALIZATION_TASKS.md) · [`ARABIC_TERMINOLOGY.md`](./ARABIC_TERMINOLOGY.md) · [`ARABIC_LOCALIZATION_PROGRESS.md`](./ARABIC_LOCALIZATION_PROGRESS.md) · [`SUPABASE_AUTH_EMAIL_TEMPLATES_AR.md`](./SUPABASE_AUTH_EMAIL_TEMPLATES_AR.md)

---

## 0. Decision summary (read this first)

> **Scope change (v2):** This is a **bilingual** project (English **and** Arabic), **not** Arabic-only. English stays fully available; Arabic is **added**. The app must ship a **visible language toggle**, persist the choice, flip `lang`/`dir` per language, and use **stable translation keys** (never hardcoded language strings). The i18n layer must be **future-extensible** so adding `fr`, `es`, … later is a small, mechanical change.

| Decision | Recommendation | Why |
|---|---|---|
| Localization approach | **Lightweight typed dictionary layer** (`messages/en.ts` + `messages/ar.ts` + `messages/index.ts` + central `lib/locales.ts` config + `lib/i18n.ts` provider/`t()`). **Not** `next-intl`. | Lowest risk; no `[locale]` routing/middleware/auth changes; cleanly supports a runtime toggle and more locales later. |
| Launch scope | **Bilingual EN + AR now**, structured to add more languages with minimal code. | Matches the new requirement. English is the **base/source** locale. |
| Default locale | **English (`en`)** when no stored preference and no clear signal; optionally honor `navigator.language` Arabic on first visit (documented, off by default for predictability). | Predictable, safe, matches current shipped UI. |
| Direction | Per-locale: `en → lang="en" dir="ltr"`, `ar → lang="ar" dir="rtl"`. Resolved from one source of truth and applied to `<html>`. | One mechanism flips the whole app either way. |
| Language toggle | **Sidebar bottom area** (primary) **+** Settings → Workspace (secondary) **+** auth-pages header (for logged-out users). | Consistent, visible, reachable logged-in and logged-out, and on mobile via the drawer. See §13. |
| Persistence | **`localStorage` key `haseeela.locale`** (least risky), hydrated SSR-safely. Optional later: mirror to a `User.locale` preference **without a schema change now** (see §13.2). | No DB migration required; logged-out users supported. |
| Digits | **Western/Latin digits** (`0-9`) in both languages; locale-aware month names. | Finance clarity, export integrity, invoice/number consistency. |
| Invoice PDF Arabic | **Phase separately** — embed an Arabic TTF via `@pdf-lib/fontkit` **and** add Arabic shaping/bidi; **English PDF keeps working unchanged**. Interim: PDF stays English until the Arabic path is reviewed. | `pdf-lib` standard fonts can't render Arabic; English is unaffected. |

Full reasoning is in §7 (Architecture), §13 (Bilingual behavior) and §10 (Risks).

---

## 1. Scope — everything that must be localized

Every **user-visible** string in these areas. (Internal identifiers are explicitly **out** of scope — see §9.)

### 1.1 Auth & account flows
- Login — `app/login/page.tsx`
- Register / Signup — `app/register/page.tsx`
- Forgot password — `app/forgot-password/page.tsx`
- Reset password — `app/reset-password/page.tsx`
- Verify email — `app/verify/page.tsx` (incl. the new **email-changed** screen)
- Email change UI — `app/profile/page.tsx`
- Onboarding — `app/onboarding/page.tsx`
- Auth shared UI — `components/auth/AuthHeader.tsx`, `components/auth/PasswordInput.tsx`, `components/layout/AuthLayout.tsx`

### 1.2 Core app pages
- Dashboard / Overview — `app/page.tsx`
- Transactions (revenue + expenses) — `app/transactions/page.tsx`
- Clients & Revenue — `app/clients/page.tsx`
- Invoices list — `app/invoices/page.tsx`
- Invoice editor (new/edit) — `app/invoices/new/page.tsx`, `app/invoices/[id]/edit/page.tsx`, `components/invoices/InvoiceEditor.tsx`
- Invoice detail — `app/invoices/[id]/page.tsx`, `components/invoices/InvoiceDocument.tsx`
- Send invoice modal — `components/invoices/SendInvoiceModal.tsx`
- Subscriptions — `app/subscriptions/page.tsx`
- Analytics — `app/analytics/page.tsx`, `components/charts/*`
- Reports — `app/reports/page.tsx`
- Archive — `app/archive/page.tsx`
- Notifications — `app/notifications/page.tsx`
- Profile — `app/profile/page.tsx`
- Settings — `app/settings/page.tsx`
- Offline page — `app/offline/page.tsx`

### 1.3 Budgets
> ⚠️ Note: A dedicated Budgets **page** does not currently exist in `app/`, though a `Budget`/`Category` model exists in Prisma and budget concepts appear in analytics/reports. Localize any budget-related labels found in analytics/reports; flag for the reviewer if a full Budgets screen is added later.

### 1.4 Navigation & shell
- Sidebar — `components/Sidebar.tsx` (nav labels: Overview, Transactions, Invoices, Clients & Revenue, Subscriptions, Analytics, Reports, Archive, Settings; user menu: Profile, Settings, Light/Dark mode, Log out)
- Topbar — `components/Topbar.tsx` (search placeholder, New button, notifications)
- Command palette — `components/CommandPalette.tsx`
- App shell / drawer (mobile) — `components/AppShell.tsx`, `components/ui/Drawer.tsx`

### 1.5 Shared UI primitives (string-bearing props passed in by callers)
- `components/ui/EmptyState.tsx`, `Toast.tsx`, `ConfirmDialog.tsx`, `Modal.tsx`, `InlineAlert.tsx`, `Badge.tsx`, `Button.tsx`, `Form.tsx` (labels/hints/placeholders), `Menu.tsx`, `Card.tsx` (SectionHeader), `Skeleton.tsx`, `Avatar.tsx`, `Icon.tsx` (aria-labels).
- Modals — `components/modals/EntityModals.tsx` (Add client / Add subscription / Add revenue / Log expense, category option labels).

### 1.6 Server-rendered / generated text
- Invoice email — `app/api/invoices/[id]/send/route.ts` + `server/emailTemplate.ts`
- Invoice PDF — `server/invoicePdf.ts`
- Reports data model & labels — `server/reports.ts` (titles, column labels, summary labels, category labels)
- Excel export — `server/reportXlsx.ts` (header band "Haseeela", "Generated …", "Total", column labels come from `reports.ts`)
- Notifications generation — `server/notifications.ts`
- Recurring billing transaction names — `server/recurring-billing.ts`, `server/linked-transactions.ts` (e.g. "… retainer payment", "… one-time payment", "… subscription payment")
- User-facing API error messages — `server/errors.ts`, `server/validation.ts`, thrown `HttpError` messages across `app/api/**`

### 1.7 Categories of micro-copy (cross-cutting — appear everywhere)
Empty states · loading states · error states · success toasts · confirmation dialogs · form validation messages · table headers & cells · filters · segmented date-range presets · status badges · tooltips / `title` / `aria-label` · placeholders · onboarding hints.

### 1.8 Metadata & PWA
- `app/layout.tsx` — `metadata.title`, `description`, `applicationName`, `appleWebApp.title`.
- `public/manifest.json` — `name`, `short_name`, `description`.
- (Keep `lang`/`dir` handling centralized — see §2.)

### 1.9 Explicitly **out** of scope for translation
Dev/mock data (`lib/mockData.ts`), debug logs (`lib/authDebug.ts`), and all internal identifiers in §9.

---

## 2. RTL requirements

### 2.1 Direction strategy (per-locale, bilingual)
- **Single source of truth.** `dir`/`lang` are derived from the **active locale** via `lib/locales.ts` and applied to `<html>` — `en → dir="ltr"`, `ar → dir="rtl"`. The toggle changes the locale; `lang`/`dir` follow automatically.
- The RTL work must be **direction-agnostic**, not "Arabic hacks": use logical Tailwind utilities so the *same* components render correctly in both LTR and RTL. Never assume RTL is permanent.
- Do **not** sprinkle `dir` on individual components (except LTR islands). Children inherit from `<html>`.
- Wrap **intentionally-LTR islands** (see §2.7) with `dir="ltr"` locally — these stay LTR in **both** languages (invoice numbers, emails, URLs, currency codes).
- See §13.4 for exactly how/when `<html lang>`/`dir` update and how to avoid hydration/layout shift.

### 2.2 Text alignment
- Replace hard `text-left` / `text-right` with logical `text-start` / `text-end` where the intent is "leading/trailing edge."
- Keep `text-right` **only** for genuinely numeric/amount columns that should hug the trailing edge — but verify they still hug the correct edge in RTL (numbers stay LTR internally; alignment becomes `text-start` in RTL for an amounts column on the right side — decide per table during QA).

### 2.3 Sidebar layout
- `components/Sidebar.tsx`: the rail sits on the **right** in RTL automatically if spacing uses logical properties. Audit: active-state left indicator (`rounded-l-*`/border-left) must become a logical/`end`/`start` indicator; collapse chevron rotation must flip; icon slot alignment must mirror.
- Mobile drawer (`Drawer.tsx`/`AppShell.tsx`) currently slides from the left — in RTL it should slide from the **right**. Make slide direction direction-aware.

### 2.4 Icon spacing
- Replace `ml-*`/`mr-*`/`pl-*`/`pr-*` next to icons with `ms-*`/`me-*`/`ps-*`/`pe-*`.
- Directional icons (chevrons, arrows, "back", trending arrows that imply direction) must be mirrored or swapped in RTL. Status/finance arrows (up/down for +/−) should **not** be mirrored.

### 2.5 Forms
- Labels and inputs align to the start edge; use `text-start`.
- Input `prefix`/`suffix` (e.g. currency symbol) position must flip: a leading `$`/`ر.س` sits on the right in RTL. Audit `components/ui/Form.tsx` prefix rendering.
- Validation/hint text aligns to start.

### 2.6 Tables, modals, dropdowns, charts
- Tables: header/cell alignment via logical props; first column becomes right-most.
- Modals/dropdowns (`Modal.tsx`, `Menu.tsx`): close button, menu anchor, and caret position mirror to the start/end edges.
- Charts (`recharts` in `components/charts/*`): legends, axis side, and tooltip anchoring should be checked. Recharts is not natively RTL — axis labels/legend may need `reversed` axis or manual positioning. Numbers stay LTR. Document any chart that can't fully mirror as an accepted limitation.

### 2.7 LTR exceptions (always render LTR even in Arabic UI)
Wrap in `dir="ltr"` (and usually `text-start`):
- Email addresses, URLs, file names.
- Invoice numbers (e.g. `INV-0001`).
- Currency **codes** (`USD`, `EGP`) and currency-formatted amounts where the symbol+digits should read left-to-right.
- IDs, tokens, technical strings.
- Code/debug snippets.
- Mixed amounts like `$1,234.56` — keep the numeric group LTR to avoid digit reordering.

### 2.8 Tailwind specifics (v3.4)
- Prefer logical utilities: `ms-/me-/ps-/pe-/start-/end-/text-start/text-end/rounded-s-/rounded-e-`.
- Use the `rtl:` / `ltr:` variants for the few cases logical props can't express (e.g. transforms, custom rotations).
- Avoid absolute `left-*`/`right-*` for anything that should mirror — use `start-*`/`end-*`.

---

## 3. Formatting requirements

Centralize all formatting in a single module (recommend `lib/format.ts`) so locale/digit policy lives in one place. Formatting is **locale-aware**: it reads the active locale and its `Intl` locale tag from `lib/locales.ts` (e.g. `en → 'en-US'`, `ar → 'ar'`). Replace ad-hoc `toLocaleDateString('en-US', …)` (17 call sites) with these helpers so English keeps its current formatting and Arabic gets Arabic month names — both with Latin digits.

| Data | Rule | Implementation note |
|---|---|---|
| **Digits** | **Western (Latin) `0-9`** everywhere. | Use `Intl.*` with `numberingSystem: 'latn'`. Do **not** use Eastern Arabic numerals in a finance app — they hurt scanning, exports, and invoice matching. |
| Dates | Arabic month/weekday names, Latin digits, RTL-safe. | `new Intl.DateTimeFormat('ar', { numberingSystem: 'latn', day:'numeric', month:'short', year:'numeric' })`. Verify direction in mixed contexts. |
| Date ranges | `from → to` with an RTL-aware separator. | Keep the two dates LTR-internally; the arrow direction is cosmetic — pick `–` or a neutral separator to avoid confusion. |
| Currency | Symbol + Latin digits; code stays LTR. | `Intl.NumberFormat('ar', { style:'currency', currency, numberingSystem:'latn' })` — **verify** symbol placement per currency; some Arabic locales place the symbol differently. If placement is inconsistent, keep the existing `en-US` currency formatting (Latin) and only translate surrounding labels. **Safest default: keep number/currency formatting on a Latin-digit formatter and translate only labels.** |
| Numbers | Grouped, Latin digits. | `Intl.NumberFormat('en-US')` or `'ar'` + `latn`. |
| Percentages | Latin digits + `%`. | Keep `%` sign; it's universal. |
| Invoice totals / report totals | Same currency rule; totals labeled in Arabic ("الإجمالي"). | Numbers numeric, labels Arabic. |
| Negative values | Keep the leading minus and red color; ensure the minus stays attached to the number (LTR group). | Avoid trailing-minus surprises in RTL. |
| Excel values | **Numeric cells stay numeric** (do not stringify). Only headers/labels are Arabic. | Preserves sorting/sums in Excel. |
| PDF text | See §4 / §10 — Arabic in PDF needs font + shaping. | Until shaping is in place, keep PDF numbers Latin and labels per the chosen PDF strategy. |

> **Recommendation for launch:** localized **labels** + **Latin digits** in both languages + locale-aware **month names** (English months in EN, Arabic months in AR). Keep numeric/currency formatting on a Latin-digit formatter to guarantee export and invoice integrity. This is the lowest-risk choice for a finance product and is identical in spirit for every future locale.

---

## 4. Email, PDF & export localization (per-language; details in companion docs)

Guiding rule: **server-generated artifacts follow the language they belong to** — the recipient/user's selected language where known, else the app default (English). See §13.7 for how the language is resolved server-side.

- **Supabase auth emails** (6 types) → **dashboard templates are single-language per template slot**; Supabase does not branch by user locale. Therefore: keep the **English** set ([`SUPABASE_AUTH_EMAIL_TEMPLATES.md`](./SUPABASE_AUTH_EMAIL_TEMPLATES.md)) **and** the **Arabic** set ([`SUPABASE_AUTH_EMAIL_TEMPLATES_AR.md`](./SUPABASE_AUTH_EMAIL_TEMPLATES_AR.md)) as parallel docs. **Document this as a platform limitation** and pick one of: (a) bilingual single template (EN + AR stacked) — recommended for a 2-language app; (b) pick the org's primary language; (c) wait for a future custom-auth-email hook. **Never** alter `{{ .ConfirmationURL }}`, `{{ .Token }}`, `{{ .Email }}`, `{{ .NewEmail }}`.
- **Invoice email** (app code) → render subject/greeting/body/detail-rows from the dictionary in the **invoice's language** (sender's selected language; see §13.7). `emailTemplate.ts` becomes direction-aware (`dir` per language). Must preserve SMTP "only mark Sent on success" and PDF attachment behavior. English path keeps working unchanged.
- **Invoice PDF** → see §10 risk. **English PDF must keep working exactly as today.** Arabic PDF is a **reviewed task** (font embed + shaping/bidi) — until done, the PDF stays English even when the UI is Arabic (documented limitation). Never let Arabic strings reach `pdf-lib`'s WinAnsi `sanitize()`.
- **Report PDF/print** → HTML/CSS print path (`app/reports/page.tsx`), so it follows the current UI language and `dir` automatically; just localize labels.
- **Excel export** → headers/labels from the dictionary in the **current UI language** via `reportXlsx.ts`/`reports.ts`; keep numeric cells numeric; file stays valid `.xlsx` (exceljs is Unicode-safe).

---

## 5. Translation quality rules
- Natural, professional Modern Standard Arabic (MSA) — clear, modern, trustworthy; **not** literal, **not** slang, **not** stiff/legalese.
- One approved Arabic term per concept — enforce [`ARABIC_TERMINOLOGY.md`](./ARABIC_TERMINOLOGY.md).
- CTAs short (1–2 words where possible): "حفظ", "إلغاء", "متابعة".
- Avoid over-long strings that break buttons, badges, stat cards, and sidebar labels — prefer concise equivalents; QA at small widths.
- Don't mix Latin/Arabic except for brand ("Haseeela"), technical tokens, currency codes, invoice numbers, URLs.
- Consistent voice: address the user politely and directly (neutral, no heavy honorifics).
- Avoid ambiguous finance terms; follow the glossary's disambiguation notes (e.g. Revenue vs Income, Gross vs Net, Retainer).

---

## 6. Manual QA checklist (Arabic UI)

> Full reviewer process is in §11 of this doc and in the Gemini instructions. This is the hands-on UI pass.

> **Run every screen in BOTH languages.** EN → `<html lang="en" dir="ltr">`; AR → `<html lang="ar" dir="rtl">`. Toggle live and confirm both render correctly.

**Global**
- [ ] Language toggle is visible, accessible (keyboard + `aria`), and switches EN↔AR live.
- [ ] `<html lang>`/`dir` update with the toggle; **no flash** of wrong direction on reload (§13.4).
- [ ] Selected language **persists** across reload and navigation (localStorage).
- [ ] In **AR**: page mirrors as a whole; no clipped/overflowing text in buttons, badges, stat cards, sidebar labels.
- [ ] In **EN**: layout is unchanged from today (no regression).
- [ ] Latin digits in both; locale-correct month names; currency codes LTR in both.
- [ ] **No hardcoded copy** — every visible string comes from `t()`; no key shows raw (e.g. `clients.empty.title` leaking to UI).
- [ ] No missing-key fallbacks visible in AR (would show English) — search pass per §11.

**Per screen** (auth, onboarding, dashboard, transactions, clients, invoices list/editor/detail/send modal, subscriptions, analytics, reports, archive, notifications, profile, settings):
- [ ] All labels, buttons, placeholders, empty states, toasts, errors translated.
- [ ] Layout mirrored correctly (icons, spacing, alignment, dividers, indicators).
- [ ] Tables: headers and amounts align correctly; amounts readable (LTR group).
- [ ] Modals/dropdowns/menus open on the correct edge; close button mirrored.
- [ ] Forms: prefixes (currency) on correct side; validation aligned to start.
- [ ] Charts: legends/axes/tooltips readable; numbers LTR; note any limitation.

**Mobile**
- [ ] Drawer slides from the right; nav mirrored; no horizontal scroll.

**Emails / PDF / Export**
- [ ] Invoice email renders RTL in Gmail/Apple Mail/Outlook; CTA + link work; PDF attaches; "Sent" only on success.
- [ ] Supabase auth emails (all 6) render RTL; links work; variables intact.
- [ ] Excel opens valid; Arabic headers; numbers numeric and summable.
- [ ] Invoice PDF: confirm chosen strategy renders (or interim English/bilingual is intentional & documented).

**Regression**
- [ ] `npx tsc --noEmit` clean.
- [ ] `npx jest` green (update only intentionally-changed visible copy assertions).
- [ ] `npm run build` succeeds.
- [ ] No `.env*` committed; no secrets; no internal identifiers translated.

---

## 7. Architecture recommendation (Phase 2 answer) — bilingual & future-extensible

**Chosen: lightweight typed dictionary layer with a runtime locale toggle and a central locale config. Bilingual EN + AR now; adding more languages later is a small, mechanical change.**

Considered options:
1. **Dictionary layer + central locale config (RECOMMENDED).** `messages/<locale>.ts` typed string maps, `lib/locales.ts` config, `lib/i18n.ts` provider + `t(key, vars?)`. ✅ No routing changes, no middleware, no auth impact, no heavy deps, fully reviewable, supports a runtime toggle, and scales to N languages.
2. **`next-intl`.** Powerful (ICU plural/format) but pushes you toward `[locale]` route segments + middleware, touching the auth/redirect surface and every route path. ❌ Higher risk than warranted; our toggle + dictionary covers the need. Revisit only if locale-prefixed URLs or rich ICU pluralization become hard product requirements.
3. **Inline strings (no layer).** ❌ Scatters copy, kills consistency, can't toggle. Reject.

> **Why this is future-proof:** components only ever call `t('key')`; languages live entirely in data files registered in one config. Adding French = add `messages/fr.ts` + one line in `lib/locales.ts` + translate the keys. No component changes.

### 7.1 File layout (scalable to N languages)
```
apps/web/src/
  messages/
    en.ts        # BASE / source of truth — every key defined here first
    ar.ts        # Arabic — must mirror en.ts keys exactly
    index.ts     # registry: { en, ar }, typed Messages = typeof en, getMessages(locale)
    # future: fr.ts, es.ts, …  (add file + register in index.ts + locales.ts)
  lib/
    locales.ts   # central locale config (see 7.2): supported locales, default, labels, dir, Intl tags
    i18n.ts      # LocaleProvider, useLocale(), t(), dir resolution, fallback logic
    format.ts    # locale-aware date/number/currency helpers (Latin digits policy)
  components/ui/
    LanguageToggle.tsx   # the visible switcher (see §13)
```

### 7.2 Central locale config (`lib/locales.ts`)
The **one place** that knows about languages. Example shape:
```ts
export type Locale = 'en' | 'ar';            // extend the union to add a language
export const DEFAULT_LOCALE: Locale = 'en';
export const LOCALES = {
  en: { label: 'English', nativeLabel: 'English', dir: 'ltr', intl: 'en-US' },
  ar: { label: 'Arabic',  nativeLabel: 'العربية', dir: 'rtl', intl: 'ar'    },
} as const satisfies Record<Locale, LocaleConfig>;
export const SUPPORTED_LOCALES = Object.keys(LOCALES) as Locale[];
export const isLocale = (v: unknown): v is Locale => SUPPORTED_LOCALES.includes(v as Locale);
export const dirFor = (l: Locale) => LOCALES[l].dir;        // 'ltr' | 'rtl'
export const intlTagFor = (l: Locale) => LOCALES[l].intl;   // for Intl.* (digits forced to 'latn')
```
`LocaleConfig` carries `label`, `nativeLabel`, `dir`, `intl`, plus any future per-locale hints. **Adding a language touches only this file + a new `messages/*.ts`.**

### 7.3 Naming conventions (stable keys)
- Keys are **dot-namespaced by area**, in **English**, and **stable**: `dashboard.title`, `invoices.send`, `auth.resetPassword.title`, `clients.empty.title`, `common.actions.save`, `errors.client.notFound`.
- Reuse `common.*` for shared micro-copy.
- Keys are identifiers — **never shown**, **never translated**.

### 7.4 How components consume strings
```tsx
const { t, locale, dir } = useLocale();
<Button>{t('common.actions.save')}</Button>
<EmptyState title={t('clients.empty.title')} body={t('clients.empty.body')} />
```
- **No hardcoded language strings in components** — both English and Arabic live in dictionaries; components are language-agnostic.
- Server code (routes, email, reports) uses a server-side `t(locale, key, vars?)` reading the same `messages/index.ts`. The locale is passed in (see §13.7).

### 7.5 Interpolation
- Named `{var}` placeholders: `t('invoices.email.intro', { client: name, number })`, `t('clients.totalPaid', { amount })`.
- The helper does a safe replace. **Never** concatenate strings in components to build sentences (word order differs per language). **Never** build HTML from unescaped user data (reuse `escapeHtml`).

### 7.6 Pluralization
- Use `Intl.PluralRules(intlTag)` via a small `plural(count, forms)` helper. English: `one/other`; Arabic: up to `zero/one/two/few/many/other`.
- Pattern: `t('invoices.count', { count })` where the message value is a per-form map resolved by the helper. Where a clean plural is hard, prefer count-neutral phrasing (`"Clients: 3"` / `"العملاء: 3"`).
- Document each pluralized key; keep all language files aligned on which keys are plural.

### 7.7 Dates / numbers / currency
- All through `lib/format.ts`, which reads `intlTagFor(locale)` (see §3). **Latin digits in every locale**; month names follow the locale. One policy, one file, locale-aware.

### 7.8 Direction (LTR/RTL) — driven by locale
- `dir` resolved via `dirFor(locale)` and applied to `<html>` (see §13.4). Components use **logical** Tailwind utilities so the same markup renders both directions. No "Arabic-only" assumptions.

### 7.9 Missing translations & fallback (must not crash prod)
- `t(key)` resolution order: **active locale → English base → the key string itself** (last resort, never throws).
- **Dev warning:** missing key → `console.warn('[i18n] missing key: …')` in development only; **silent** in production.
- Production **must never crash** on a missing/typo'd key — it degrades to English, then to the key text.

### 7.10 Type safety & key alignment
- `Messages = typeof enMessages` is the **base type**; every other locale file is typed `: Messages`, so a missing/extra key is a **compile error** (`tsc`).
- Add a tiny **CI/script check** (`scripts/i18n-check.ts`) that diffs each locale's key set against `en.ts` and fails on missing/extra/duplicated/unused keys; run it in CI.
- Keeps `en`, `ar`, and any future locale **perfectly aligned** and prevents key drift.

### 7.11 Tests
- Prefer asserting by **role/test-id/behavior**, not visible copy. Where a test must check copy, assert via the **key** or render under a known locale. Keep both languages testable (§13.6). Never delete a test to make copy pass.

### 7.12 Email / PDF / export strings
- Server-side; pull from `messages/index.ts` with an explicit locale (§13.7). Email/PDF get their own direction-aware rendering. English keeps current behavior; Arabic PDF needs the font/shaping work in §10.

### 7.13 Adding a new language later (the whole checklist)
1. Create `src/messages/<locale>.ts` typed `: Messages` (translate every base key).
2. Register it in `messages/index.ts` and add a `LOCALES` entry in `lib/locales.ts`.
3. Run `tsc` + `scripts/i18n-check.ts`; fix any missing keys.
4. (Optional) add email templates for that language; Excel/PDF/report labels work automatically (they read the dictionary).
5. Test UI direction (LTR/RTL) and date/number/currency formatting.
**No component edits required.**

---

## 8. Email localization scope (pointer)
Two parallel auth-email docs exist (Supabase can't branch by user locale): **English** [`SUPABASE_AUTH_EMAIL_TEMPLATES.md`](./SUPABASE_AUTH_EMAIL_TEMPLATES.md) and **Arabic** [`SUPABASE_AUTH_EMAIL_TEMPLATES_AR.md`](./SUPABASE_AUTH_EMAIL_TEMPLATES_AR.md). Decide per §4 (recommended: bilingual stacked template). Invoice email follows the sender's selected language — Tasks T-EM-01/02. See §13.7 for server-side language resolution.

---

## 9. Do-NOT-translate list (internal identifiers)
DB table/column names · API field names (JSON keys) · enum values (`INCOME`, `EXPENSE`, `COMPLETED`, `PENDING`, `DRAFT`, `SENT`, `PAID`, `OVERDUE`, `ACTIVE`, `onetime`, `retainer`, `MONTHLY`…) · category **codes** (`CLIENT`, `TOOLS`, `OPERATIONS`, `TAXES`, `OTHER`, `PROJECT`) · route paths (`/clients`, `/invoices/[id]`…) · env var names · Supabase template variables (`{{ .ConfirmationURL }}` etc.) · Prisma model/field identifiers · test IDs · CSS class names · package names · deterministic transaction id prefixes (`auto-client-onetime-…`) · debug logs.

> Category codes stay as codes in the DB; only their **display labels** (in `reports.ts` `CATEGORY_LABELS` and `EntityModals.tsx` option labels) are resolved through the dictionary to **both** English and Arabic. The code never changes.
>
> **Bilingual rule:** never remove or replace English copy — move it into `messages/en.ts` and add the Arabic counterpart in `messages/ar.ts`. Both must always exist for every key.

---

## 10. Risks & edge cases

| Risk | Severity | Mitigation |
|---|---|---|
| **Invoice PDF can't render Arabic** (`pdf-lib` WinAnsi `sanitize()` strips Arabic; no shaping/bidi) | 🔴 High | Treat as its own task. Options: (a) embed Arabic TTF via `@pdf-lib/fontkit` **plus** pre-shape with `arabic-reshaper` + bidi reordering before `drawText`; (b) interim: keep PDF labels English/bilingual. Do **not** pass raw Arabic to current `sanitize()`. Decide before implementing. |
| RTL layout breakage (sidebar indicator, drawer slide, chevrons, prefixes) | 🟠 Med | Logical Tailwind utilities + per-screen QA (§6). |
| Recharts not natively RTL (legends/axes) | 🟠 Med | Manual axis/legend config; accept documented limitations; keep numbers LTR. |
| Table overflow with longer Arabic headers | 🟠 Med | Concise glossary terms; test at small widths; allow wrap/ellipsis. |
| Email-client RTL inconsistency (Outlook) | 🟠 Med | Table-based, inline-CSS, `dir="rtl"` on container + `align` per cell; test in Gmail/Apple Mail/Outlook. |
| Supabase variable breakage | 🔴 High | Never translate/alter `{{ … }}`; keep exact casing/spacing; QA real links. |
| Mixed-direction invoice number/date/currency | 🟠 Med | Wrap technical tokens in `dir="ltr"`; keep numeric groups LTR. |
| Long Arabic labels in small components (badges, stat cards) | 🟠 Med | Short equivalents; QA. |
| Mobile drawer opens wrong side | 🟠 Med | Direction-aware slide. |
| Tests asserting English copy | 🟡 Low | Few/none assert UI copy today; update intentionally or assert via keys. |
| Excel labels translated but values stringified | 🟠 Med | Keep numeric cells numeric; only headers Arabic. |
| Arabic font missing in app UI (Inter has no Arabic) | 🟠 Med | Add an Arabic webfont (e.g. Cairo / Tajawal / IBM Plex Sans Arabic / Noto Sans Arabic) in `app/layout.tsx`; keep Latin fallback for numbers/codes. |
| Hard-coded `lang="en"` / `en-US` formatters | 🟠 Med | Centralize in `layout.tsx` + `lib/format.ts`; replace 17 call sites. |
| **Hydration mismatch / flash of wrong direction** when locale comes from `localStorage` (server can't read it) | 🟠 Med (bilingual-new) | Inline a tiny pre-paint script in `<head>` that sets `<html lang/dir>` from `localStorage` before React hydrates (same pattern as the existing theme no-flash script). Render a stable default on the server; reconcile on mount. See §13.4. |
| **English regression** — a string moved to `t()` but Arabic-only value hardcoded, dropping English | 🟠 Med (bilingual-new) | Enforce "every key exists in BOTH `en.ts` and `ar.ts`"; `tsc` + `i18n-check` script; reviewer greps for hardcoded non-key copy. |
| **Key drift** between locale files over time | 🟡 Low (bilingual-new) | `Messages` base type + `i18n-check` script in CI (§7.10). |
| **Toggle doesn't re-render server components / cached data** | 🟡 Low (bilingual-new) | Locale lives in a client provider; server-generated artifacts (email/PDF/export) take locale explicitly (§13.7), not from React state. |
| **Both languages double the QA surface** | 🟠 Med (bilingual-new) | Test matrix runs each screen in EN (LTR) and AR (RTL); see §6 + §13.6. |
| Auth emails can't auto-switch language (Supabase limitation) | 🟠 Med (bilingual-new) | Bilingual stacked template or primary-language choice; documented in §4. |
| Currency symbol placement varies by Arabic locale | 🟡 Low | Prefer Latin-digit formatter + Arabic labels; verify per currency. |

---

## 11. Reviewer process (Claude, after Gemini finishes) — Phase 5

1. Read [`ARABIC_LOCALIZATION_PROGRESS.md`](./ARABIC_LOCALIZATION_PROGRESS.md).
2. Inspect every changed file (`git diff` review).
3. Verify every task in [`ARABIC_LOCALIZATION_TASKS.md`](./ARABIC_LOCALIZATION_TASKS.md) is done & accurate.
4. **Search for hardcoded copy that bypasses `t()`** (the bilingual failure mode) in `.tsx`/`.ts`/email/pdf/export/metadata:
   - Grep heuristics: human-readable string literals in JSX text, `title=`, `label=`, `placeholder=`, `aria-label=`, `toast(`, `throw new HttpError(…, '…')`, `subject:`, `heading:`, `intro:`, column `label:` — each should be a `t('key')`, not a literal.
   - Run `scripts/i18n-check.ts` (key parity) and confirm AR has no missing keys (which would surface as English fallbacks in the AR UI).
   - Confirm **no English was deleted** — `en.ts` covers every key.
5. Confirm **no internal identifiers** translated (cross-check §9); confirm the **toggle + persistence + no-flash** work.
6. Confirm **no Supabase variables** altered.
7. Confirm **no env/secrets** touched; no `.env*` staged.
8. `npx tsc --noEmit` (app code clean).
9. `npx jest` (green; only intended copy assertions changed).
10. `npm run build` (succeeds).
11. **Manual pass across all screens in BOTH languages** (§6): EN (LTR, must equal today) and AR (RTL), plus the live toggle + persistence + mobile drawer.
12. Review Arabic copy quality vs glossary & tone.
13. Review all email templates (auth + invoice) in real clients.
14. Review invoice PDF Arabic strategy result/limitation.
15. Review Excel exports (valid, numeric, Arabic headers).
16. **Fix small safe issues directly** (typos, a stray English label, a logical-property miss).
17. **Punch-list larger issues** back to Gemini in the progress doc.

**Final report contents:** what was localized · files changed · tests passed · build status · remaining English (if any) · RTL issues (if any) · PDF/email/export limitations · deployment readiness · manual Supabase/Vercel steps.

---

## 12. Scope estimate
- **~22 pages**, **~30 components**, **~8 server string-bearing modules**, **6 Supabase email templates × 2 languages**, **1 invoice email (bilingual)**, **1 invoice PDF**, **1 Excel export**, **2 chart areas**, plus metadata/manifest.
- Plus bilingual infrastructure: locale config, provider, toggle component, persistence, no-flash script, fallback + type-safety script.
- Estimated **~40 implementation tasks** (see Tasks doc) across ~18–20 sessions of small, reviewable changes.
- Effort note vs Arabic-only: most of the extra cost is **one-time infrastructure** (toggle, config, persistence, fallback). Writing two dictionaries instead of one is incremental; English copy already exists (just relocated into `en.ts`).

---

## 13. Bilingual behavior & language toggle (NEW)

### 13.1 Language toggle UX
- **Control:** a compact switcher showing the **other** language's native label (e.g. shows "العربية" when in English, "English" when in Arabic), or a two-option segmented control `EN | ع`. Use the existing `Segmented`/`Menu` UI primitives for visual consistency.
- **Accessibility:** real `<button>`/menu, keyboard-focusable, `aria-label="Change language"` / `aria-pressed`, visible focus ring, and it announces the change. Don't rely on flag icons alone (flags ≠ languages).
- **Placement (recommended, consistent across surfaces):**
  - **Primary — Sidebar bottom area** (near the user card / collapse control): always visible for logged-in users, desktop + collapsed rail (icon + tooltip when collapsed).
  - **Mobile — inside the drawer** (`AppShell`/`Drawer`) at the same bottom position, so mobile users get it too.
  - **Secondary — Settings → Workspace** (next to Currency): the "settings home" for the preference.
  - **Logged-out — Auth pages header** (`AuthLayout`/`AuthHeader`): so login/register/reset can be read in either language before sign-in.
  - These four surfaces share **one** `LanguageToggle` component and one persistence path — no duplicated logic.

### 13.2 Persistence
- **Source of truth: `localStorage['haseeela.locale']`** (`'en' | 'ar'`). Lowest risk, works logged-out, no DB change.
- **Resolution order on load:** `localStorage` → (optional) `navigator.language` Arabic match on first visit → `DEFAULT_LOCALE` (`en`).
- **Server-side mirror (optional, later, NOT now):** the `User` model already stores `currency`; a `locale` column could be added **additively** when there's a reason (e.g. emails must match the user's last UI choice across devices). **No schema change for launch** — documented as a future enhancement so per-device localStorage is the v1 behavior. If/when added, it's a non-breaking nullable column + extend the existing `/api/user/preferences` PATCH (already supports partial updates).
- Also set a cookie mirror (`haseeela.locale`) **only if** SSR needs to read the locale before hydration to reduce flash — optional; the no-flash script (§13.4) already handles the visual case.

### 13.3 Initial language default
- **Default = English (`en`)** — matches today's shipped UI and is predictable.
- Optional first-visit auto-detect from `navigator.language` (Arabic → `ar`) may be enabled but is **off by default**; if enabled, the explicit toggle always wins and is stored.

### 13.4 Updating `<html lang>` / `dir` without flash or hydration mismatch
- **Server render:** `<html lang={DEFAULT_LOCALE} dir="ltr">` (stable, deterministic) so SSR markup is consistent and React doesn't warn.
- **Pre-paint no-flash script:** inline a tiny script in `<head>` (mirror of the existing `themeNoFlashScript`) that, before first paint, reads `localStorage['haseeela.locale']` and sets `document.documentElement.lang` + `dir` accordingly. This prevents a flash of LTR when the stored locale is Arabic.
- **Runtime:** `LocaleProvider` (client) reads the stored locale on mount, sets React state, and keeps `document.documentElement.lang/dir` in sync whenever the toggle changes. Because the no-flash script already set the attributes, there's no visible jump.
- **Hydration safety:** never compute locale-dependent *markup* during SSR from a value the server can't see (localStorage). Render text via `t()` with the default locale on the server, then let the client swap on mount; for direction, the attributes are corrected pre-paint so layout doesn't shift. Avoid conditionally rendering different DOM trees per locale during hydration.

### 13.5 Toggling at runtime
- Toggle calls `setLocale(next)` → updates provider state + `localStorage` + `document.documentElement.lang/dir`. The tree re-renders with new `t()` output; logical Tailwind utilities flip layout automatically. No full reload required.
- Currency/number/date formatters read the active locale (`lib/format.ts`), so they update in the same render.

### 13.6 Testing both languages
- **Unit:** render components under a test `LocaleProvider` for `en` and `ar`; assert via keys or known values; assert `dir` attribute.
- **i18n integrity:** `scripts/i18n-check.ts` (key parity) + `tsc` (type parity) in CI.
- **Manual matrix:** every screen in §6 run twice (EN/LTR and AR/RTL) + a toggle-persistence check (switch, reload, navigate) + mobile drawer in both.
- **No-flash check:** set locale to Arabic, hard-reload, confirm no LTR flash.

### 13.7 Emails / PDF / exports per language
- **Resolution of "which language" server-side** (no React there):
  - **Invoice email & PDF:** use the **sender's** selected language. Pass it explicitly from the client when calling the send route (e.g. body `{ locale }`), validated with `isLocale()`, default `en`. (A future `User.locale` could replace the passed value.)
  - **Excel / report export & print:** use the **current UI language** at export time (client passes `locale` as a query param to `/api/reports`, validated server-side).
- **Invoice email:** subject/greeting/body/detail-row labels come from `messages/<locale>` via the server `t`; `emailTemplate.ts` sets `dir` per language. English path is byte-for-byte the current behavior when `locale='en'`.
- **Invoice PDF:** English renders today's PDF unchanged. **Arabic PDF is a reviewed task** (embed Arabic TTF via `@pdf-lib/fontkit` + shaping/bidi). Until implemented, Arabic invoices still produce an **English** PDF (documented limitation) rather than a broken one — never pass raw Arabic to the WinAnsi `sanitize()`.
- **Excel:** headers/labels localized; numeric cells stay numeric; valid `.xlsx` in both languages; optional `views[].rightToLeft = true` when locale is RTL.
- **Supabase auth emails:** platform can't pick per user → keep parallel EN/AR template docs and choose **bilingual stacked** templates (recommended) or a primary language. See §4.

### 13.8 Bilingual non-negotiables (for the implementer)
- English stays fully available; Arabic is **added**, never a replacement.
- **Every** user-facing string flows through `t()`; no hardcoded Arabic **or** English in components.
- Every key exists in **both** `en.ts` and `ar.ts` (enforced by types + script).
- Never translate internal identifiers, routes, enums, DB values, env vars, or Supabase variables.
- The toggle, persistence, and `dir` switching are **direction-agnostic** — built to add more languages, not Arabic-special-cased.
