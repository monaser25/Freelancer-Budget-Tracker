# FlowLedger — Mobile Redesign Brief

> **Platform:** Mobile app (native-feel; iOS & Android). Phone-first; tablet = scaled-up phone.
> **Direction:** "Calm Fintech" — modern, premium, dark-mode-first financial tool.
> **Audience for this doc:** Claude Design / a UI designer building the production mobile app.
> This file is self-contained: full design system in §2, screens in §6.
> **Token values are identical to the web brief** — only layout & interaction differ.

---

## 1. Design Philosophy — "Calm Fintech"

FlowLedger helps freelancers track income, expenses, clients/retainers, and tool subscriptions on the go. The
mobile app must feel **fast, thumb-friendly, and native** — never a shrunk-down website.

**Principles**

1. **Money is the hero.** Big, legible amounts with **tabular numerals**. Income always emerald, expense always
   red. The single most useful number (e.g. Net this month) leads each screen.
2. **One-thumb operation.** Primary actions reachable in the lower third. Bottom tab bar + **FAB** for quick add.
3. **Native patterns.** Bottom sheets (not center modals), swipe actions, pull-to-refresh, long-press,
   platform-correct back behavior, haptics on key actions.
4. **Calm by default, color on purpose.** Neutral surfaces; color = meaning (positive/negative/brand/status).
5. **Dark mode first**, light mode supported.
6. **Glanceable → drill in.** Cards & summaries up top; tap to open full detail screens or sheets.

**Tone:** confident, quiet, premium. Think the polish of Mercury / Revolut / Linear mobile — restrained, not flashy.

---

## 2. Design System

> Identical token *values* to the web brief.

### 2.1 Color tokens

Define for light and dark. Reference tokens everywhere — never hardcode.

**Brand / Accent (indigo-violet)**

| Token | Light | Dark | Use |
|-------|-------|------|-----|
| `accent` | `#6D5EFC` | `#7C6FFF` | Primary buttons, FAB, active tab, links, focus |
| `accent-hover` (pressed) | `#5B4FE0` | `#8B7FFF` | Pressed state |
| `accent-tint` | `#EEEDFE` | `#1C1A33` | Selected rows, subtle fills, active tab bg |
| `accent-fg` | `#FFFFFF` | `#FFFFFF` | Content on accent |

**Neutrals & surfaces**

| Token | Light | Dark | Use |
|-------|-------|------|-----|
| `bg` | `#FBFBFD` | `#09090B` | Screen background |
| `surface` | `#FFFFFF` | `#18181B` | Cards, list items, sheets |
| `surface-elevated` | `#FFFFFF` | `#1F1F23` | Bottom sheets, menus (raised) |
| `surface-hover` (pressed) | `#F4F4F6` | `#222226` | List item pressed |
| `border` | `#E7E7EC` | `#27272A` | Dividers, card/input borders |
| `border-strong` | `#D4D4D8` | `#3F3F46` | Input focus, emphasis |
| `text` | `#18181B` | `#FAFAFA` | Primary text, numbers |
| `text-secondary` | `#52525B` | `#A1A1AA` | Labels, secondary copy |
| `text-muted` | `#A1A1AA` | `#71717A` | Placeholders, captions, disabled |

**Semantic (finance) — consistent across modes**

| Token | Light | Dark | Use |
|-------|-------|------|-----|
| `positive` / income | `#10B981` | `#34D399` | Income, revenue, gains, success |
| `positive-tint` | `#ECFDF5` | `#0E2A22` | Income chip/row bg |
| `negative` / expense | `#EF4444` | `#F87171` | Expense, losses, destructive |
| `negative-tint` | `#FEF2F2` | `#2A1414` | Expense chip/row bg |
| `warning` | `#F59E0B` | `#FBBF24` | Due-soon, attention |
| `info` | `#0EA5E9` | `#38BDF8` | Neutral info |

**Data-viz palette (charts):** `#6D5EFC · #10B981 · #F59E0B · #0EA5E9 · #F43F5E · #8B5CF6 · #14B8A6`.
Income series = `positive`, expense series = `negative`, categorical = palette order.

### 2.2 Typography

- **UI font:** `Inter` (fallback: SF Pro on iOS / Roboto on Android, `system-ui`).
- **Numeric:** Inter tabular numerals (`"tnum" 1`) for all amounts/dates. Optional `Geist Mono`/`JetBrains Mono`
  for hero balance figures.

**Type ramp (mobile — larger for touch; body ≥ 16 to avoid zoom)**

| Token | Size / line-height | Weight | Use |
|-------|--------------------|--------|-----|
| `hero` | 34 / 40 | 700 | Balance / headline number on a screen |
| `title` | 28 / 34 | 600 | Screen titles (large nav title) |
| `h1` | 22 / 28 | 600 | Section headers |
| `h2` | 18 / 24 | 600 | Card titles, sheet titles |
| `body` | 16 / 22 | 400 | Default body, list primary text |
| `body-medium` | 16 / 22 | 500 | Emphasized, buttons |
| `small` | 14 / 20 | 400 | Secondary list text, helper |
| `caption` | 12 / 16 | 500 | Labels, badges, tab labels |

### 2.3 Spacing, radius, shadow, layout

- **Spacing (4px base):** `2,4,8,12,16,20,24,32,40,48,64`. Screen side padding **16**. Card padding 16–20.
  Section gap 24.
- **Radius:** `sm 8` (chips/inputs) · `md 12` (buttons) · `lg 16` (cards/list groups) · `xl 20` (bottom sheets
  top corners, hero cards) · `full` (pills, FAB, avatars).
- **Shadows:** light — soft `0 2px 8px rgba(16,24,40,.08)` on cards/FAB; dark — borders + faint glow.
- **Touch targets:** min **44×44pt**. Primary buttons full-width, height 52. List rows ≥ 56.
- **Safe areas:** respect notch/home indicator (top inset for headers, bottom inset above tab bar & FAB).

### 2.4 Motion & gestures

- Durations `fast 120 / base 200 / slow 280ms`; spring for sheets & FAB.
- **Bottom sheets** slide up from bottom; drag handle; dismiss by swipe-down or backdrop tap; snap points
  (half / full) for long forms.
- **Swipe actions** on list rows: swipe-left reveals Delete (negative) + Edit; swipe-right (optional) reveals
  Record Payment (positive).
- **Pull-to-refresh** on list screens. **Long-press** = context menu (Edit/Delete/Duplicate).
- **Haptics:** light on toggle/selection, success on payment recorded, warning on destructive confirm.
- Page transitions: push from right (native stack). Respect reduce-motion.

### 2.5 Accessibility

- Text contrast ≥ 4.5:1 in both modes. Support Dynamic Type / font scaling (don't truncate amounts).
- Visible focus/selection for external keyboard & switch control. VoiceOver/TalkBack labels on icon buttons &
  amounts ("Income, 1,200 dollars").
- Color never the only signal (pair with sign/icon/label).

---

## 3. Components

States to design: **default · pressed · focused · disabled · loading**.

- **Button** — `primary` (filled accent, full-width 52h), `secondary` (surface + border), `ghost`,
  `destructive`. Pressed = scale 0.98 + accent-hover. Loading = spinner, keep size.
- **FAB** — floating accent circle (56) bottom-right above tab bar; tap → quick-add sheet (Revenue / Expense /
  Invoice / Client). Optional speed-dial expansion.
- **Input / Select / Stepper** — label above, large tap target (52h), helper/error below; focus = border-strong
  + accent ring. Currency input shows symbol prefix + numeric keypad.
- **Date picker** — native wheel/calendar sheet.
- **Card** — surface, radius `lg`, padding 16–20; used for stats, clients, subscriptions, sub-summaries.
- **Stat / balance card** — caption label + hero number (tabular) + delta chip (▲/▼ colored). Horizontal-scroll
  carousel of stat cards on dashboards.
- **List item / row** — left icon or avatar, primary text + secondary line, right amount (signed, colored) +
  chevron. Min 56h. Swipe + long-press actions. Group rows in rounded `lg` cards with dividers.
- **Segmented control** — period (Week/Month/Year), type toggle (Income/Expense), filters.
- **Filter chips** — horizontally scrollable row (All · Revenue · Expenses · Subscriptions · Clients · Tools…).
- **Badge / Chip** — status (Active/Prospect/Completed/Inactive), type (Retainer/One-time, Revenue/Expense),
  flags (Auto, Edited, Archived). Tinted semantic style.
- **Bottom sheet** — replaces modals. Drag handle, title, content, sticky footer button(s). Form sheets snap to
  full height with keyboard avoidance.
- **Confirmation sheet** — destructive: icon, title, impact line, two stacked buttons (primary destructive +
  Cancel). Client/Subscription delete offers **Archive** vs **Delete permanently**.
- **Empty state** — centered icon in tinted circle, title, one line, primary CTA.
- **Loading** — skeleton cards/rows (shimmer); inline spinners for actions; pull-to-refresh spinner.
- **Toast / snackbar** — bottom, above tab bar; success/error/info; swipe to dismiss.
- **Avatar** — initials on accent-tint circle (28/40/48).
- **Charts** — Bar (revenue vs expenses), Donut (revenue by client), horizontal bar (expenses by category).
  Touch tooltips; compact legends; empty state.
- **Tab bar** — see §4.

---

## 4. Navigation pattern (mobile)

**Bottom tab bar (5 tabs)** — fixed, safe-area aware, blur/`surface` background, active = accent icon + label,
inactive = muted.

1. **Home** (Overview)
2. **Transactions**
3. **(center FAB)** — quick add (floats over the bar)
4. **Clients**
5. **More** (Subscriptions, Invoices, Analytics, Reports, Archive, Settings) — opens a grouped menu screen.

> The 5 visible destinations: Home · Transactions · Clients · Analytics · More. The **FAB** is the persistent
> quick-add. Adjust ordering to taste, but keep Home + quick-add always reachable.

**Top of screen:** large title (collapses to compact on scroll), optional left back chevron (in stacks), right
actions (search, notifications bell with badge, filter).

**Quick-add sheet (FAB):** big choice buttons — Add Revenue (positive) · Log Expense (negative) · New Invoice ·
Add Client. Each opens its form sheet.

**Search & notifications** reachable from Home header. **Command-palette equivalent:** a search sheet across
clients/subscriptions/transactions.

---

## 5. Global states & rules

- **Loading:** skeletons matching layout; pull-to-refresh on lists.
- **Empty:** tailored per screen with CTA.
- **Error:** inline banner + snackbar; offline → Offline screen.
- **Numbers:** currency formatter (USD/EUR/GBP/EGP/SAR/AED, formatting only), tabular, positive green /
  negative red, thousands separators.
- **Dates:** relative in lists, absolute in detail.
- **Keyboard:** numeric pad for amounts; sheets avoid keyboard; "Done" accessory.

---

## 6. Screens

Each: **Purpose · Layout · Components · States · Interactions.** **(NEW)** = doesn't exist yet. Fields map to the
real model (`Client`, `Subscription`, `Transaction`, `Category`).

### 6.1 Splash / launch
- **Purpose:** Brand moment while session loads.
- **Components:** centered logo on `bg`, subtle accent animation; transitions to Login or Home.

### 6.2 Login
- **Purpose:** Email/password sign-in.
- **Layout:** Logo top, value-prop line, form (email, password w/ show-hide), full-width "Log in", "Forgot
  password?" link, "Create account" secondary, inline error / unconfirmed-email banner with "Resend" + cooldown.
- **States:** default, submitting, error, unconfirmed (resend + cooldown), success → Home.

### 6.3 Register **(enhanced)**
- **Fields:** name (model has `User.name`), email, password (min 8 + strength), "Create account". Success →
  "Check your email" screen with resend + cooldown.

### 6.4 Forgot password **(NEW)**
- Email field + "Send reset link" + success confirmation + cooldown.

### 6.5 Reset password **(NEW)**
- New password + confirm (strength), "Update password" → Login.

### 6.6 Verify email **(NEW)**
- States: verifying / success ("Continue") / expired (resend).

### 6.7 Onboarding **(NEW)** — swipeable steps
- **Layout:** Full-screen, paged, dots indicator, Continue / Skip.
- **Steps:** 1) Welcome + name. 2) Choose currency (6 options; "formatting only"). 3) Add first client (name,
  payment type, amount — skippable). 4) Add first subscription (name, amount, cycle — skippable). 5) Done →
  "Go to home".
- **Interactions:** swipe between steps; haptic on finish.

### 6.8 Home / Overview
- **Purpose:** At-a-glance finances + quick add.
- **Layout (scroll):**
  - **Hero:** "Net this month" big number (hero, colored) + Revenue/Expenses sub-figures.
  - **Stat cards carousel** (horizontal scroll): Total Revenue · Total Expenses · Active Subscriptions
    (monthly burden) · Total Clients. Each tappable → its screen.
  - **Revenue vs Expenses** bar chart (6-month), swipeable.
  - **Recent Transactions** (last 5) as a rounded list card → tap for all.
  - **Active Subscriptions** mini list (next billing) + **Top Client** card.
- **Components:** hero number, stat carousel, bar chart, list cards.
- **States:** skeletons; empty (new user → onboarding CTA); populated. Pull-to-refresh.
- **Header:** title "Home", search icon, notifications bell.

### 6.9 Transactions
- **Purpose:** Full ledger.
- **Layout:** Title + search; **filter chips** row (All · Revenue · Expenses · Subscriptions · Clients · by
  category). Transactions grouped by date (section headers), rendered as list rows: left category/source icon,
  name + notes/source chip, right amount (signed, colored) + Auto/Edited badges. Date-range filter in a sheet.
- **Components:** filter chips, grouped list, swipe actions (Edit/Delete), badges.
- **States:** loading, empty per filter, editing-auto warning.
- **Interactions:** tap row → edit sheet; swipe-left delete; pull-to-refresh; FAB add.

### 6.10 Add / Edit Transaction (sheet)
- **Components:** type toggle (Income/Expense colored), amount (large, numeric pad, currency prefix), name,
  date picker, category select (by type), notes. Auto-transaction warning banner. Sticky "Save".
- **States:** create/edit, validation, auto-edit warning, saving.

### 6.11 Invoices — list **(NEW)**
- **Layout:** Title + "New" (FAB or header). Summary chips (Outstanding/Overdue/Paid). Filter chips (All/Draft/
  Sent/Paid/Overdue). List rows: client, invoice #, due date, status badge, amount. Overdue highlighted.
- **States:** loading, empty, overdue emphasis.

### 6.12 Invoice — create/edit **(NEW)**
- **Layout:** Full-screen form (sheet/stack): client select, dates, line items (add/remove rows: description,
  qty, rate → amount), tax/discount, notes, currency; running totals (tabular). Actions: Save draft · Send ·
  Preview/PDF.

### 6.13 Invoice — detail **(NEW)**
- Document preview (scrollable) + status timeline + action buttons (Send, Mark paid → optional linked income,
  Download PDF, Duplicate, Delete).

### 6.14 Clients
- **Purpose:** Manage clients & revenue.
- **Layout:** Title + "Show archived" toggle (in header/sheet) + FAB add. Revenue-by-client **donut** summary
  card on top + Top Client. List of client rows/cards: avatar, name, company, payment-type + status badges,
  amount (`$X/mo` or `$X`), next billing/payment date, total paid (right, positive).
- **Components:** donut card, client cards, badges, swipe actions (Record Payment / Edit / Delete), expandable
  payment history (tap to expand last 3).
- **States:** loading, empty, archived view (greyed + Restore).
- **Interactions:** swipe-right Record Payment (retainer+active) → linked income; tap → client detail sheet;
  delete → archive vs permanent sheet with impact line.

### 6.15 Add / Edit Client (sheet)
- **Fields:** name, company, email, client type (Individual/Company), status, payment type (One-time → date +
  amount; Retainer → billing day + next billing date + monthly amount). Conditional fields. Sticky Save.

### 6.16 Subscriptions
- **Layout:** Title + "Show archived" + FAB. **Total monthly cost** hero card. List of subscription cards: icon,
  name, cycle badge, monthly-equivalent (right), next billing date, status. Swipe: Record Payment / Edit / Delete.
- **States:** loading, empty, archived.
- **Interactions:** Record Payment → linked expense; delete → archive vs permanent with past-transaction count.

### 6.17 Add / Edit Subscription (sheet)
- **Fields:** name, amount, billing cycle (Monthly/Quarterly/Yearly), next billing date, status, notes.

### 6.18 Analytics
- **Purpose:** Period analysis.
- **Layout (scroll):** **period segmented control** (Week/Month/Year). 4 metric cards (carousel): Revenue,
  Expenses, Net Profit, Profit Margin %. **Revenue vs Expenses** bar chart (period breakdown). **Client revenue**
  list (ranked, % bars). **Expenses by category** horizontal bars. **Subscription costs** section. **All-time
  summary** grid.
- **States:** loading, empty per period.
- **Interactions:** switch period re-aggregates; tap chart segment → filtered Transactions; tooltips on touch.

### 6.19 Reports / Export **(NEW)**
- Report type chips (P&L, Transactions, Client revenue, Tax), date range, format (CSV/PDF), Export → share sheet.

### 6.20 Archive
- **Layout:** Info note. Sections: Archived Clients / Archived Subscriptions — rows with greyed avatar, name,
  badge, archive date, historical txn count, **Restore**.
- **States:** empty, error (restore failed), populated.

### 6.21 More (menu)
- **Purpose:** Hub for non-tab destinations.
- **Layout:** Grouped list: Subscriptions · Invoices · Analytics · Reports · Archive · Notifications · Settings ·
  Help. User card at top (avatar, name, email → Profile). Plan badge + "Upgrade" if Free.

### 6.22 Settings / Preferences
- **Layout:** Grouped list sections.
  - **Account:** email, Log out, → Profile.
  - **Workspace:** Currency (6; "formatting only"), Accounting Mode (Cash basis, read-only), Current summary.
  - **Appearance (NEW):** Theme (System/Light/Dark).
  - **Notifications (NEW):** billing reminders, invoice due, weekly summary toggles.
- **States:** per-row save, success haptic/toast.

### 6.23 Profile / Account **(NEW)**
- Name, email (change → re-verify), avatar, change password, delete account (destructive confirm), log out
  everywhere.

### 6.24 Pricing / Plans **(NEW)**
- Billing toggle (Monthly/Yearly + savings). Plan cards stacked (Free/Pro/Business): price (tabular), feature
  checks, CTA (Current/Upgrade). Popular highlighted. FAQ accordion.

### 6.25 Billing & Upgrade **(NEW)**
- Current plan card (plan, renewal, price), payment method, invoice history list (date/amount/status/download),
  Upgrade/Cancel (confirm sheets).

### 6.26 Notifications **(NEW)**
- Header (title + Mark all read). Tabs All/Unread. Rows: type icon (billing=warning, payment=positive,
  overdue=negative), text, timestamp, unread dot, action. Swipe to dismiss. Empty state.

### 6.27 Offline
- WiFi-off icon, "You're offline", cached-data note, "Try again". (PWA/native offline fallback.)

### 6.28 Error / Not found **(NEW)**
- Illustration, title, description, "Back to home" CTA; error variant adds "Report problem".

---

## 7. Screen index

| # | Screen | Status |
|---|--------|--------|
| 6.1 | Splash / launch | NEW |
| 6.2 | Login | redesign |
| 6.3 | Register | redesign + name |
| 6.4 | Forgot password | NEW |
| 6.5 | Reset password | NEW |
| 6.6 | Verify email | NEW |
| 6.7 | Onboarding (5 steps) | NEW |
| 6.8 | Home / Overview | redesign |
| 6.9 | Transactions | redesign |
| 6.10 | Add/Edit Transaction (sheet) | redesign |
| 6.11 | Invoices — list | NEW |
| 6.12 | Invoice — create/edit | NEW |
| 6.13 | Invoice — detail | NEW |
| 6.14 | Clients | redesign |
| 6.15 | Add/Edit Client (sheet) | redesign |
| 6.16 | Subscriptions | redesign |
| 6.17 | Add/Edit Subscription (sheet) | redesign |
| 6.18 | Analytics | redesign |
| 6.19 | Reports / Export | NEW |
| 6.20 | Archive | redesign |
| 6.21 | More (menu) | NEW |
| 6.22 | Settings / Preferences | redesign + theme/notifications |
| 6.23 | Profile / Account | NEW |
| 6.24 | Pricing / Plans | NEW |
| 6.25 | Billing & Upgrade | NEW |
| 6.26 | Notifications | NEW |
| 6.27 | Offline | redesign |
| 6.28 | Error / Not found | NEW |

---

## 8. Handoff notes

- **Start with §2 (tokens) and §3 (components)** before screens.
- **Dark mode first**, then light from the token tables.
- **Token values are identical to the web brief** — a user moving between web and phone should feel the same
  product. Only layout & interaction patterns differ (tab bar + FAB + sheets + swipe vs sidebar + tables + modals).
- Honor **native conventions**: safe areas, 44pt targets, body ≥16, bottom sheets over modals, swipe & pull-to-
  refresh, haptics, Dynamic Type.
- Every amount uses the **currency formatter** (6 currencies, formatting only) + **tabular numerals** +
  positive/negative color.
- Deliverables suggested: token sheet, component library, then each screen in §6 (default + key states), in both
  light and dark, with safe-area framing.
