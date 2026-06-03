# FlowLedger — Redesign Package

A production-grade redesign brief for **FlowLedger**, a financial management app for freelancers
(income, expenses, clients/retainers, tool subscriptions, analytics, invoicing).

The current UI was a fast prototype built only to validate features. This package defines a brand-new
**"Calm Fintech"** design direction and a complete design system, ready to hand to **Claude Design**
(or any designer / AI design tool) to build the real product UI.

## What's in here

| File | For | Use it to build |
|------|-----|-----------------|
| [`web-redesign-brief.md`](./web-redesign-brief.md) | **Web app** (desktop-first, responsive) | The browser app: sidebar nav, command palette, dense data tables, multi-column dashboards |
| [`mobile-redesign-brief.md`](./mobile-redesign-brief.md) | **Mobile app** (native-feel, iOS/Android) | The phone app: bottom tab bar, FAB, bottom sheets, swipe actions, card lists |

Each file is **self-contained** — it includes the full design system (tokens, components, motion) inside
it, so you can hand either one off on its own without the other.

## How to use with Claude Design

1. Open the file for the platform you're designing (web **or** mobile).
2. Paste the whole file as context, or point Claude Design at it.
3. Ask for a screen by name (e.g. *"Design the Dashboard / Overview screen using this brief"*). Every screen
   in the brief lists its purpose, layout, components, and states.
4. Start with the **Design System** section first so foundational tokens/components are established, then
   generate screens.

## Design direction at a glance — "Calm Fintech"

- **Dark mode first, light mode supported.** Both are first-class.
- **Distinct brand:** indigo-violet accent `#6D5EFC` (replaces the prototype's generic blue).
- **Money is the hero:** financial figures use **tabular numerals**; income is emerald, expense is red,
  consistently, everywhere.
- **Calm & spacious:** soft radii, restrained shadows, generous spacing, one clear primary action per screen.
- **Same product, leveled up:** all current screens are redesigned, plus the missing screens a real product
  needs (onboarding, password reset, pricing/billing, invoicing, profile, notifications, reports, error states).

## Consistency between web & mobile

Both briefs share **identical design tokens** (colors, type ramp values, radii, motion). They differ only in
**layout and interaction patterns** suited to each platform. A user moving between web and the phone app
should feel they're in the same product.

## Source of truth (current app)

The redesign is based on the existing app in `apps/web`. Key references used while writing these briefs:

- Screens: `apps/web/src/app/*/page.tsx`
- Layout: `apps/web/src/components/{AppShell,Sidebar,Topbar}.tsx`
- Current tokens: `apps/web/src/app/globals.css`, `apps/web/tailwind.config.js`
- Data model: `apps/web/prisma/schema.prisma`
- Currencies: `apps/web/src/lib/currency.ts` (USD, EUR, GBP, EGP, SAR, AED — formatting only, no conversion)
