# FlowLedger — Web Redesign Brief

> **Platform:** Web app (desktop-first, fully responsive down to tablet/mobile browser).
> **Direction:** "Calm Fintech" — modern, premium, dark-mode-first financial tool.
> **Audience for this doc:** Claude Design / a UI designer building the production web app.
> This file is self-contained: the full design system lives in §2, screens in §6.

---

## 1. Design Philosophy — "Calm Fintech"

FlowLedger helps freelancers see their money clearly: who pays them, what they spend, and whether they're
profitable. The UI must feel **trustworthy, calm, and precise** — never noisy.

**Principles**

1. **Money is the hero.** Financial figures are the most important pixels on screen. Use tabular numerals so
   columns of numbers align. Income is always emerald, expense always red — no exceptions.
2. **Calm by default, color on purpose.** Mostly neutral surfaces. Color appears only to carry meaning
   (positive/negative, brand action, status).
3. **One primary action per screen.** A single filled accent button is the obvious next step; everything else
   is secondary/ghost.
4. **Dense but breathable.** Power users scan tables fast, so support density — but with comfortable line
   height, clear grouping, and whitespace between sections.
5. **Dark mode first.** Design dark first, then map to light. Both are production-quality.
6. **Progressive disclosure.** Lead with summaries (stat cards, charts), let users drill into detail
   (tables, rows, drawers).

**Tone:** confident, quiet, professional. Think Linear / Mercury / Stripe Dashboard — not a flashy consumer
finance app.

---

## 2. Design System

> Identical token *values* to the mobile brief. Only layout/interaction differs across platforms.

### 2.1 Color tokens

Define as CSS variables on `:root` (light) and `.dark` (dark). All UI colors reference these — never hardcode.

**Brand / Accent (indigo-violet)**

| Token | Light | Dark | Use |
|-------|-------|------|-----|
| `--accent` | `#6D5EFC` | `#7C6FFF` | Primary buttons, active nav, links, focus, brand |
| `--accent-hover` | `#5B4FE0` | `#8B7FFF` | Hover/pressed |
| `--accent-tint` | `#EEEDFE` | `#1C1A33` | Active nav bg, selected rows, subtle fills |
| `--accent-fg` | `#FFFFFF` | `#FFFFFF` | Text/icon on accent |

**Neutrals & surfaces**

| Token | Light | Dark | Use |
|-------|-------|------|-----|
| `--bg` | `#FBFBFD` | `#09090B` | App background |
| `--surface` | `#FFFFFF` | `#18181B` | Cards, sidebar, panels |
| `--surface-elevated` | `#FFFFFF` | `#1F1F23` | Modals, popovers, dropdowns (raised) |
| `--surface-hover` | `#F4F4F6` | `#222226` | Row/list hover |
| `--border` | `#E7E7EC` | `#27272A` | Dividers, card borders, inputs |
| `--border-strong` | `#D4D4D8` | `#3F3F46` | Input focus border, emphasis |
| `--text` | `#18181B` | `#FAFAFA` | Primary text, numbers |
| `--text-secondary` | `#52525B` | `#A1A1AA` | Labels, secondary copy |
| `--text-muted` | `#A1A1AA` | `#71717A` | Placeholders, captions, disabled |

**Semantic (finance) — consistent across modes**

| Token | Light | Dark | Use |
|-------|-------|------|-----|
| `--positive` / income | `#10B981` | `#34D399` | Income amounts, revenue, gains, success |
| `--positive-tint` | `#ECFDF5` | `#0E2A22` | Income badge/row bg |
| `--negative` / expense | `#EF4444` | `#F87171` | Expense amounts, losses, destructive |
| `--negative-tint` | `#FEF2F2` | `#2A1414` | Expense badge/row bg |
| `--warning` | `#F59E0B` | `#FBBF24` | Due-soon, attention |
| `--warning-tint` | `#FFFBEB` | `#2A2010` | |
| `--info` | `#0EA5E9` | `#38BDF8` | Neutral info, tips |

**Data-viz palette (charts, in order)**

`#6D5EFC` · `#10B981` · `#F59E0B` · `#0EA5E9` · `#F43F5E` · `#8B5CF6` · `#14B8A6`

Charts: grid lines use `--border`; axis labels use `--text-muted`; income series uses `--positive`, expense
series uses `--negative` (always), categorical breakdowns use the palette above.

### 2.2 Typography

- **UI font:** `Inter` (var fallback: `-apple-system, "Segoe UI", system-ui, sans-serif`).
- **Numeric:** Inter with `font-feature-settings: "tnum" 1, "cv01" 1;` (tabular numerals). Large hero numbers
  may use `Geist Mono` / `JetBrains Mono` for a "ledger" feel — optional.
- All currency/amount/date figures use **tabular numerals**.

**Type ramp (web)**

| Token | Size / line-height | Weight | Use |
|-------|--------------------|--------|-----|
| `display` | 32 / 40 | 600 | Hero numbers, page-level totals |
| `h1` | 24 / 32 | 600 | Page titles |
| `h2` | 20 / 28 | 600 | Section headers |
| `h3` | 17 / 24 | 600 | Card titles, modal titles |
| `body` | 14 / 20 | 400 | Default body, table cells |
| `body-medium` | 14 / 20 | 500 | Emphasized body, buttons |
| `small` | 13 / 18 | 400 | Secondary, helper text |
| `caption` | 12 / 16 | 500 | Labels, badges, table headers (uppercase, tracking +0.04em) |
| `micro` | 11 / 14 | 500 | Timestamps, fine print |

### 2.3 Spacing, radius, shadow, layout

- **Spacing scale (4px base):** `2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64`. Card padding 20–24; section gap 24–32.
- **Radius:** `sm 8` (inputs, badges) · `md 12` (buttons, cards) · `lg 16` (panels, modals) · `xl 20` (hero
  cards) · `full` (pills, avatars).
- **Shadows (light):** `sm: 0 1px 2px rgba(16,24,40,.06)` · `md: 0 4px 12px rgba(16,24,40,.08)` ·
  `lg: 0 12px 32px rgba(16,24,40,.12)`. **Dark:** prefer borders + subtle glow; shadows nearly invisible,
  use `--border` + `0 0 0 1px` ring on raised surfaces.
- **Layout grid:** content max-width `1280px`, centered; 12-col fluid grid, 24px gutters. Sidebar `260px`
  (collapsible to `72px` icon-rail).

### 2.4 Motion

- Durations: `fast 120ms`, `base 180ms`, `slow 240ms`.
- Easing: `cubic-bezier(0.2, 0.8, 0.2, 1)` (ease-out) for enter; `cubic-bezier(0.4, 0, 1, 1)` for exit.
- Modals: fade + 8px rise. Drawers: slide from right. Numbers in stat cards: count-up on first load (≤400ms).
- Respect `prefers-reduced-motion`.

### 2.5 Accessibility

- Contrast ≥ 4.5:1 for text (verify accent-on-surface and muted text in both modes).
- Visible focus ring: `0 0 0 2px var(--bg), 0 0 0 4px var(--accent)`.
- All icon-only buttons have `aria-label`. Color is never the sole signal (pair with +/− sign, icon, or label).
- Min hit target 32px (web); 40px for primary actions.

---

## 3. Components

Each component lists variants + states. States to design everywhere: **default · hover · focus · active/pressed
· disabled · loading**.

- **Button** — variants: `primary` (filled accent), `secondary` (surface + border), `ghost` (text only),
  `destructive` (red), `icon`. Sizes: sm 32, md 36, lg 40. Loading shows spinner + keeps width.
- **Input / Select / Textarea** — label above, helper/error below. Focus = `--border-strong` + accent ring.
  Error state = red border + red helper text. Prefix/suffix slots (e.g. currency symbol, `/mo`).
- **Date picker** — calendar popover; used for transaction date, billing dates, invoice dates.
- **Card / Panel** — `surface`, border, radius `lg`, padding 20–24. Optional header row (title + action).
- **Stat card** — label (caption), big number (`display`, tabular), delta chip (▲/▼ with positive/negative
  color), optional sparkline. Clickable variant (hover lift, links to detail).
- **Table** — sticky header (caption style, uppercase), zebra optional, row hover = `--surface-hover`, sortable
  column headers, right-align numeric columns, row actions on hover (edit/delete icons) + overflow `⋯` menu.
  Density toggle (comfortable/compact). Selectable rows (checkbox) for bulk actions.
- **Badge / Chip** — status (Active/Prospect/Completed/Inactive), type (Revenue/Expense), flags (Auto, Edited,
  Archived). Filled-tint style using semantic tints. Filter chips (toggleable) for table filters.
- **Tabs / Segmented control** — for filters (All/Revenue/Expenses…) and period (Week/Month/Year).
- **Modal / Dialog** — centered, `surface-elevated`, radius `lg`, max-width 480 (forms) / 560 (confirmations
  with detail). Header (title + close), body, footer (right-aligned: ghost Cancel + primary action).
- **Drawer** — right-side slide-in (440px) as an alternative to modals for richer detail (e.g. invoice detail,
  client detail).
- **Confirmation dialog** — destructive variant: icon, title, explanation, impact line (e.g. "12 past
  transactions will be kept"), two-choice footer. For client/subscription delete: offer **Archive** vs
  **Delete permanently**.
- **Empty state** — centered icon in tinted circle, title, one-line description, primary CTA. One per list.
- **Loading** — skeleton rows/cards (shimmer) for first load; inline spinner for actions; never block whole
  page after first paint.
- **Toast / inline alert** — success (positive), error (negative), info. Top-right stack, auto-dismiss 4s.
- **Avatar** — initials on accent-tint circle; sizes 24/32/40.
- **Command palette (⌘K)** — global search + quick actions (see §4).
- **Dropdown menu / popover** — row actions, user menu, filters.
- **Chart wrappers** — Bar (revenue vs expenses), Pie/Donut (revenue by client), Horizontal bar (expenses by
  category). Consistent tooltip, legend, empty state ("No data for this period").
- **Currency display** — helper that formats per selected currency (USD/EUR/GBP/EGP/SAR/AED), tabular, with
  sign + color by direction.

---

## 4. Navigation pattern (web)

**App shell:** fixed left **sidebar** + top **header bar** + scrollable content.

**Sidebar (260px, collapsible to 72px icon rail)**
- Brand (FlowLedger logo) at top.
- Primary nav (icon + label, active = `accent-tint` bg + accent text + 2px left accent bar):
  `Overview` · `Transactions` · `Invoices` · `Clients` · `Subscriptions` · `Analytics` · `Reports`.
- Secondary group (bottom): `Archive` · `Settings`.
- User card at very bottom: avatar + name/email + dropdown (Profile, Billing, Theme toggle, Log out).
- Collapse toggle. Persist collapsed state.

**Header bar (sticky, 60px)**
- Left: page title + optional subtitle/breadcrumb.
- Center/left: global **search** (opens command palette).
- Right: theme toggle, **notifications bell** (badge for unread), **+ New** primary button (dropdown:
  Transaction / Invoice / Client / Subscription).

**Command palette (⌘K / Ctrl+K)** — fuzzy search across clients, subscriptions, transactions, pages; quick
actions ("Add revenue", "Log expense", "New invoice", "Go to Analytics"); recent items.

**Responsive:** below `lg` (1024px) sidebar collapses to a slide-over drawer (hamburger in header); below `md`
the app mirrors the mobile bottom-tab pattern (see mobile brief) — but the mobile *app* is the dedicated phone
experience.

---

## 5. Global states & rules

- **Loading:** skeletons that match final layout (stat cards, table rows, chart blocks).
- **Empty:** every list/table has a tailored empty state with a CTA.
- **Error:** inline alert at top of affected section + toast; never a blank screen.
- **Offline:** banner + the dedicated Offline screen (§6.16).
- **Number formatting:** all amounts via the currency formatter; positive green / negative red; thousands
  separators; up to user's currency decimals (default 0 in summaries, 2 in detail where relevant).
- **Dates:** relative for recency ("2 days ago") in lists, absolute ("Jun 2, 2026") in detail/tooltips.

---

## 6. Screens

For each: **Purpose · Layout · Components · States · Interactions.** Screens marked **NEW** don't exist yet.
Data fields reference the real model (`Client`, `Subscription`, `Transaction`, `Category`).

### 6.1 Login
- **Purpose:** Email/password sign-in.
- **Layout:** Split layout — left: brand panel (logo, one-line value prop, subtle gradient/illustration using
  accent); right: centered form card (max 400). On small screens, single column.
- **Components:** logo, email input, password input (show/hide), primary "Log in" button, "Forgot password?"
  link, secondary link to Register, inline alert (errors / "confirm your email"), "Resend confirmation email"
  button (conditional, with cooldown timer).
- **States:** default, submitting (button loading), error (bad credentials), unconfirmed-email (show resend +
  rate-limit cooldown), success (redirect to Overview).
- **Interactions:** Enter submits; remember last email.

### 6.2 Register **(enhanced)**
- **Purpose:** Create account.
- **Layout:** Same split as Login.
- **Components:** name (NEW — schema has `User.name`), email, password (min 8, with strength meter), "Create
  account" button, link to Login, success state ("Check your email to confirm"), resend button + cooldown.
- **States:** default, validating (inline field errors), submitting, success (email-sent confirmation card),
  error.

### 6.3 Forgot password **(NEW)**
- **Purpose:** Request reset link.
- **Layout:** Centered form card (split layout reused).
- **Components:** email input, "Send reset link" button, back-to-login link, success state ("If an account
  exists, we sent a link"), cooldown.

### 6.4 Reset password **(NEW)**
- **Purpose:** Set a new password from email link.
- **Components:** new password + confirm, strength meter, "Update password" button, success → redirect to Login.

### 6.5 Verify email **(NEW)**
- **Purpose:** Landing after clicking confirmation link.
- **States:** verifying (spinner), success ("Email confirmed" → Continue to app), expired/invalid (resend CTA).

### 6.6 Onboarding **(NEW)** — multi-step
- **Purpose:** Get a new user to first value fast.
- **Layout:** Full-screen wizard; left progress rail (steps) or top stepper; centered content; Back / Continue /
  Skip footer.
- **Steps:**
  1. **Welcome** — name confirm, short "what you'll do" copy.
  2. **Currency** — choose display currency (USD/EUR/GBP/EGP/SAR/AED); note "formatting only".
  3. **Add your first client** — quick form (name, payment type one-time/retainer, amount). Skippable.
  4. **Add your first subscription/tool** — name, amount, cycle. Skippable.
  5. **Done** — summary + "Go to dashboard" primary CTA.
- **States:** per-step validation; skip allowed; final confetti/success moment (subtle).

### 6.7 Dashboard / Overview
- **Purpose:** Financial snapshot + quick entry.
- **Layout:**
  - Row of **5 stat cards**: Total Clients · Total Revenue (positive) · Total Expenses (negative) · Net Profit ·
    Active Subscriptions (monthly burden). Each clickable → relevant screen, with delta vs previous period.
  - **Quick actions** strip: Add Revenue · Log Expense · New Invoice · Add Client (open modal / route).
  - **Revenue vs Expenses** bar chart (6-month rolling), full-width or 2/3 column.
  - Right column (1/3): **Active Subscriptions** card (top 4, next billing date) + **Top Client** mini-card.
  - **Recent Transactions** table (last 5; row → Transactions).
- **Components:** stat cards (with sparkline + delta), quick-action buttons, bar chart, mini list cards, compact
  table.
- **States:** first-load skeletons; empty (new user → "Add your first transaction" CTA + link to onboarding);
  populated.
- **Interactions:** clicking a stat card deep-links with the right filter (e.g. Revenue → Transactions?type=income).

### 6.8 Transactions
- **Purpose:** Full ledger of income/expenses (manual + auto from clients/subscriptions).
- **Layout:** Header (title + "Add Transaction" primary). Filter row: segmented/chip filters — All · Revenue ·
  Expenses · Subscriptions · Clients · by Category (Tools, Operations…). Search box. Date-range picker.
  Then the **table**.
- **Table columns:** Description (name + notes + source chip) · Category (badge) · Date · Type (badge: Revenue
  green / Expense red; flags: `Auto`, `Edited`) · Amount (right-aligned, signed, colored) · Actions (edit,
  delete on hover + `⋯`).
- **Components:** filter chips, search, date range, sortable table, badges, row actions, bulk-select bar
  (delete multiple), pagination or infinite scroll.
- **States:** loading skeleton rows; empty (per filter: "No revenue yet"); editing-auto warning.
- **Interactions:** sort by column; click row → edit drawer/modal; bulk delete; export current view (→ Reports).

### 6.9 Add / Edit Transaction (modal)
- **Purpose:** Create or edit a transaction.
- **Components:** type toggle (Income/Expense, colored), name, amount (currency prefix), date picker, category
  select (filtered by type), notes textarea. For auto transactions: amber warning banner ("This was generated
  from a recurring source; edits mark it as Edited"). Footer: Cancel (ghost) + Save (primary).
- **States:** create vs edit; validation; auto-edit warning; saving.

### 6.10 Invoices — list **(NEW)**
- **Purpose:** Manage client invoices.
- **Layout:** Header (title + "New Invoice" primary). Summary stat cards: Outstanding · Overdue · Paid (this
  month). Filter chips: All · Draft · Sent · Paid · Overdue. Table.
- **Table columns:** Invoice # · Client · Issue date · Due date · Status (badge) · Amount (right-aligned) ·
  Actions (view, send, mark paid, download PDF, `⋯`).
- **States:** loading, empty ("Create your first invoice"), overdue highlighted (warning/negative).

### 6.11 Invoice — create/edit **(NEW)**
- **Purpose:** Build an invoice.
- **Layout:** Two-pane — left form, right **live preview** of the invoice document.
- **Form:** client select (or add new), invoice #/dates, line items (description, qty, rate → amount; add/remove
  rows), tax/discount, notes/terms, currency. Totals auto-calc (subtotal, tax, total) with tabular numerals.
- **Actions:** Save draft · Send · Download PDF.
- **States:** validation, saving, sending; empty line-items prompt.

### 6.12 Invoice — detail / preview **(NEW)**
- **Purpose:** View a single invoice + status timeline.
- **Layout:** Document preview (printable) + side panel (status, client, payment record, actions: Send, Mark
  paid, Duplicate, Download, Delete). Marking paid can create a linked income transaction.

### 6.13 Clients & Revenue
- **Purpose:** Manage clients; track revenue.
- **Layout:** Two columns.
  - **Left (main):** header (title + "Show archived" toggle + "Add Client" primary). List of **client cards**:
    avatar (initials), name, company, payment-type badge (Retainer/One-time), status badge
    (Active/Prospect/Completed/Inactive), amount (`$X/mo` retainer or `$X` one-time), next billing / payment
    date, total paid (right, positive). Card actions: Record Payment (retainer+active only), Edit, Delete.
    Expandable payment history (last 3).
  - **Right (360px):** Revenue-by-client **donut chart** + **Top Client** card.
- **Components:** client card, status/type badges, donut chart, record-payment action, expandable history.
- **States:** loading, empty ("Add your first client"), archived view (greyed cards + Restore).
- **Interactions:** Record Payment → creates linked income transaction on next billing date; Delete → archive
  vs permanent dialog with transaction-impact line.

### 6.14 Add / Edit Client (modal)
- **Fields:** name, company, email, client type (Individual/Company), status (Active/Prospect/Completed/
  Inactive), payment type (One-time → payment date + amount; Retainer → billing day + next billing date +
  monthly amount). Footer: Cancel + Save.
- **States:** create/edit, conditional fields by payment type, validation, saving.

### 6.15 Subscriptions
- **Purpose:** Manage recurring tools/SaaS costs.
- **Layout:** Header (title + "Show archived" + "Add Subscription"). **Total monthly cost** hero stat (sum of
  active, normalized to monthly). List of **subscription cards**: icon/avatar, name, cycle badge
  (Monthly/Quarterly/Yearly), monthly-equivalent cost (right), billing amount detail, next billing date,
  status badge. Actions: Record Payment, Edit, Delete.
- **States:** loading, empty, archived view.
- **Interactions:** Record Payment → linked expense transaction; Delete → archive vs permanent with past-
  transaction count.

### 6.16 Add / Edit Subscription (modal)
- **Fields:** name, amount, billing cycle (Monthly/Quarterly/Yearly), next billing date, status, notes.

### 6.17 Analytics
- **Purpose:** Period-based financial analysis.
- **Layout:** Header + **period segmented control** (Week / Month / Year). 4 metric cards (Revenue, Expenses,
  Net Profit, Profit Margin %). Main **Revenue vs Expenses** bar chart (breakdown adapts to period: daily/
  weekly/monthly). Two-column: left **Client revenue** table (ranked, % bars, mini-stats: total/active/
  retainers); right **Expenses by category** horizontal bar + table. **Subscription costs** section (per-sub
  period charge + % of expenses). Recent transactions (period). **All-time summary** grid (8 metrics).
- **States:** loading, empty per period ("No data for this week").
- **Interactions:** period switch re-aggregates; hover tooltips; click category/client → filtered Transactions.

### 6.18 Reports / Export **(NEW)**
- **Purpose:** Generate & export financial reports.
- **Layout:** Report type selector (P&L summary, Transactions, Client revenue, Tax summary), date-range picker,
  format toggle (CSV / PDF), preview area, "Export" primary.
- **States:** configuring, generating (progress), ready (download), empty range.

### 6.19 Archive
- **Purpose:** Restore archived clients/subscriptions.
- **Layout:** Info banner (archived items don't bill but keep history). Two sections: **Archived Clients** and
  **Archived Subscriptions** — each row: greyed avatar, name, type/cycle badge, archive date, historical
  transaction count, **Restore** button.
- **States:** empty ("Nothing archived"), error (restore failed), populated.

### 6.20 Settings / Preferences
- **Purpose:** Account + workspace config.
- **Layout:** Sectioned cards.
  - **Account:** email (read-only), Log out, link to Profile.
  - **Workspace:** Currency select (6 options; note "formatting only, no conversion"); Accounting Mode (Cash
    basis, read-only); Current summary (total revenue formatted).
  - **Appearance (NEW):** theme toggle (System / Light / Dark).
  - **Notifications (NEW):** toggles for billing reminders, invoice due, weekly summary email.
- **States:** saving (per-setting optimistic), success toast.

### 6.21 Profile / Account **(NEW)**
- **Purpose:** Edit personal info & security.
- **Components:** name, email (change w/ re-verify), avatar (optional), change password, delete account
  (destructive, confirm dialog), sessions/log out everywhere.

### 6.22 Pricing / Plans **(NEW)**
- **Purpose:** Present SaaS tiers.
- **Layout:** Billing toggle (Monthly/Yearly w/ savings badge). 3 plan cards (e.g. Free / Pro / Business):
  price (display, tabular), feature list (check rows), CTA (current plan = disabled "Current", others = "Upgrade").
  Most-popular highlighted with accent border + ribbon. FAQ accordion below.
- **States:** current plan indicated, loading on upgrade.

### 6.23 Billing & Upgrade **(NEW)**
- **Purpose:** Manage subscription/payment.
- **Components:** current plan card (plan, renewal date, price), usage (if usage-based), payment method, invoice
  history table (date, amount, status, download), Upgrade/Downgrade/Cancel actions (confirm dialogs).

### 6.24 Notifications center **(NEW)**
- **Purpose:** Surface reminders & events.
- **Layout:** Header (title + "Mark all read"). Filter tabs (All/Unread). List of notification rows: icon by
  type (billing due = warning, payment recorded = positive, invoice overdue = negative), text, timestamp,
  unread dot, action link. Empty state.

### 6.25 Offline
- **Purpose:** Fallback when network is unavailable (PWA).
- **Components:** WiFi-off icon in tinted circle, "You're offline" title, note that cached data is available,
  "Try again" button (reload).

### 6.26 404 / Error **(NEW)**
- **Purpose:** Not-found & unexpected-error pages.
- **Components:** large code/illustration, title, description, "Back to dashboard" CTA. Error variant adds
  "Report problem".

---

## 7. Screen index

| # | Screen | Status |
|---|--------|--------|
| 6.1 | Login | redesign |
| 6.2 | Register | redesign + name field |
| 6.3 | Forgot password | NEW |
| 6.4 | Reset password | NEW |
| 6.5 | Verify email | NEW |
| 6.6 | Onboarding (5 steps) | NEW |
| 6.7 | Dashboard / Overview | redesign |
| 6.8 | Transactions | redesign |
| 6.9 | Add/Edit Transaction (modal) | redesign |
| 6.10 | Invoices — list | NEW |
| 6.11 | Invoice — create/edit | NEW |
| 6.12 | Invoice — detail | NEW |
| 6.13 | Clients & Revenue | redesign |
| 6.14 | Add/Edit Client (modal) | redesign |
| 6.15 | Subscriptions | redesign |
| 6.16 | Add/Edit Subscription (modal) | redesign |
| 6.17 | Analytics | redesign |
| 6.18 | Reports / Export | NEW |
| 6.19 | Archive | redesign |
| 6.20 | Settings / Preferences | redesign + theme/notifications |
| 6.21 | Profile / Account | NEW |
| 6.22 | Pricing / Plans | NEW |
| 6.23 | Billing & Upgrade | NEW |
| 6.24 | Notifications center | NEW |
| 6.25 | Offline | redesign |
| 6.26 | 404 / Error | NEW |

---

## 8. Handoff notes

- **Start with §2 (tokens) and §3 (components)** so the design system exists before screens.
- Build **dark mode first**, then derive light using the token tables.
- Keep **token values identical to the mobile brief** — only layout/interaction patterns differ.
- Every amount uses the **currency formatter** (6 currencies, formatting only) + **tabular numerals** +
  positive/negative color rules.
- Deliverables suggested: token sheet, component library page, then each screen in §6 (default + key states),
  in both light and dark.
