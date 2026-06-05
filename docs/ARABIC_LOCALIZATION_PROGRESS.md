# Haseeela — Bilingual (EN + AR) Localization Progress Tracker

> **Scope: bilingual (English + Arabic) with a language toggle — not Arabic-only.** English is never removed.
> **Gemini updates this file continuously while implementing.** The reviewer (Claude) reads it first at handoff.
> Status legend: ☐ todo · ◐ in-progress · ☑ done · ⚠ blocked/needs-reviewer.
> Keep it honest — if something is partial, say so.

---

## 1. Current status
- **Phase:** Foundation complete (v2 bilingual); implementation in progress.
- **Overall progress:** 7 / ~40 tasks.
- **Last updated:** Today
- **Blockers:** Invoice PDF Arabic strategy (T-PDF-01) needs reviewer sign-off before coding.
- **Bilingual invariants to keep true:** every key in BOTH `en.ts` + `ar.ts`; all copy via `t()`; toggle persists; `lang`/`dir` per locale; English unchanged from today.

---

## 2. Task status (mirror of [`ARABIC_LOCALIZATION_TASKS.md`](./ARABIC_LOCALIZATION_TASKS.md))

| ID | Area | Status | Notes |
|---|---|---|---|
| T-00a | Locale config (`lib/locales.ts`) | ☑ | en+ar; default en; built to extend |
| T-00b | i18n layer (`messages/en.ts`+`ar.ts`+`i18n.ts`) | ☑ | en = base; fallback active→en→key |
| T-00c | Key-parity script (`i18n-check`) | ☑ | |
| T-00d | Language toggle + persistence | ☑ | sidebar+drawer+settings+auth header; localStorage |
| T-01 | Direction, no-flash & fonts + metadata | ☑ | per-locale lang/dir; Arabic font alongside Inter |
| T-02 | Locale-aware formatting (`lib/format.ts`) | ☑ | Latin digits both; EN parity |
| T-03 | Shared RTL utility sweep (direction-agnostic) | ☑ | EN unchanged + AR mirrors |
| T-10 | Sidebar | ☐ | |
| T-11 | Topbar | ☐ | |
| T-12 | Command palette | ☐ | |
| T-20 | Login | ☐ | |
| T-21 | Register | ☐ | |
| T-22 | Forgot password | ☐ | |
| T-23 | Reset password | ☐ | |
| T-24 | Verify email (+ email-changed) | ☐ | Do NOT change token/refresh logic |
| T-25 | Onboarding | ☐ | |
| T-30 | Dashboard / Overview | ☐ | |
| T-31 | Transactions + entity modals | ☐ | |
| T-32 | Clients & Revenue | ☐ | |
| T-33 | Subscriptions | ☐ | |
| T-34 | Analytics / charts | ☐ | Note recharts RTL limits |
| T-35 | Archive | ☐ | |
| T-36 | Notifications (UI + server gen) | ☐ | |
| T-37 | Profile | ☐ | |
| T-38 | Settings | ☐ | |
| T-39 | Offline | ☐ | |
| T-40 | Invoices list | ☐ | |
| T-41 | Invoice editor | ☐ | |
| T-42 | Invoice detail | ☐ | |
| T-43 | Send invoice modal | ☐ | Preserve SMTP behavior |
| T-50 | Reports UI | ☐ | |
| T-51 | Report data labels | ☐ | Keep codes/enums English |
| T-52 | Excel export | ☐ | Keep numeric cells numeric |
| T-EM-01 | Invoice email | ☐ | |
| T-EM-02 | Supabase auth emails (6) | ☐ | Dashboard paste |
| T-PDF-01 | Invoice PDF Arabic | ⚠ | Approach decision required |
| T-PDF-02 | Report print/PDF | ☐ | |
| T-70 | API error messages | ☐ | |
| T-71 | Validation messages | ☐ | |
| T-72 | Auto transaction names | ⚠ | Translate at display, not write |
| T-80 | Test alignment | ☐ | |
| T-81 | Typecheck/build gates | ☐ | |
| T-82 | Progress upkeep | ◐ | This file |
| T-83 | Dictionary parity upkeep (all locales) | ☐ | en is base; keys aligned via types + script |

---

## 2b. Bilingual infrastructure status
- Supported locales: `en`, `ar` (default `en`). Config file: `src/lib/locales.ts` — ☑
- Dictionaries: `messages/en.ts` (base) ☑ · `messages/ar.ts` ☑ · key parity (`i18n-check`) ☑
- Provider + `t()` + fallback (active→en→key) + dev warn — ☑
- Language toggle wired: sidebar ☑ · mobile drawer ☑ · settings ☑ · auth header ☑
- Persistence (`localStorage['haseeela.locale']`) ☑ · no-flash pre-paint script ☑ · per-locale `lang`/`dir` ☑
- Locale-aware formatting (`lib/format.ts`, Latin digits both) — ☑
- EN regression check (UI identical to today) — ☑
- "Add a new language" verified as a config + file change only — ☑ (optional smoke test)

## 3. Completed areas
_(Gemini: list areas fully done, with date.)_
- Group 0 — Foundation (Date: Today)
- …

## 4. Files changed
_(Gemini: maintain a running list — path + one-line what/why.)_

| File | Change | Task |
|---|---|---|
| `src/lib/locales.ts` | Added locale config and default locale for EN/AR support | T-00a |
| `src/messages/*`, `src/lib/i18n.tsx` | Added bilingual dictionaries, provider, `t()`, and fallback flow | T-00b |
| `scripts/i18n-check.ts`, `package.json` | Added key-parity validation script and npm wiring | T-00c |
| `components/ui/LanguageToggle.tsx` and wired components | Added language toggle and persistence wiring across UI entry points | T-00d |
| `app/layout.tsx`, `globals.css` | Added per-locale direction, font handling, and no-flash support | T-01 |
| `src/lib/format.ts` and usages | Added locale-aware formatters with Latin digits preserved | T-02 |
| `components/ui/*`, `Drawer.tsx`, `AppShell.tsx` | Swapped to logical CSS properties for RTL-safe layout behavior | T-03 |

## 5. Strings translated
_(Counts or notable sections.)_
- Keys added to `messages/ar.ts`: _n_
- Keys mirrored in `messages/en.ts`: _n_

## 6. RTL / layout changes
_(Components/screens whose layout was mirrored; any tricky fixes.)_
- …

## 7. Emails changed
- Invoice email (T-EM-01, **bilingual** — follows sender locale): ☐ — EN tested ☐ / AR tested ☐ — Gmail ☐ / Apple Mail ☐ / Outlook ☐
- Supabase auth emails (T-EM-02): approach = _(bilingual-stacked / primary-language)_ — EN ☐ / AR ☐ — pasted in dashboard ☐ / variables verified ☐

## 8. PDFs changed
- Invoice PDF (T-PDF-01): approach chosen = _(a embed+shape / b interim)_; status ⚠
- Report print/PDF (T-PDF-02): ☐

## 9. Exports changed
- Excel (T-52): ☐ — valid `.xlsx` ☐ / numeric cells preserved ☐ / Arabic headers ☐

## 10. Tests updated
| Test file | What changed | Why |
|---|---|---|
| | | |
- `npx tsc --noEmit`: _(result)_
- `npx jest`: _(result)_
- `npm run build`: _(result)_

## 11. Issues found
_(Bugs, regressions, or surprises discovered during localization.)_
- …

## 12. Questions for reviewer
_(Anything uncertain — translations, RTL trade-offs, brand wordmark, PDF approach.)_
- …

## 13. Remaining work
_(What's left, in priority order.)_
- …

## 14. Final implementation summary
_(Fill at handoff: what was localized, scope covered, known limitations, and explicit "ready for review" statement. Do NOT deploy.)_
- …
