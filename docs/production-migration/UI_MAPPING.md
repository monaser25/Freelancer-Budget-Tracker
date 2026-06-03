# HASEELA UI Mapping

This maps the HASEELA premium prototype to production Next.js files.

## Reference Principle

HASEELA files are design references only.

Production code lives under:

```text
apps/web
```

## MVP-Supported Screens

| Current production route | Current file | HASEELA reference | Backend support | Priority |
|---|---|---|---|---:|
| `/` | `apps/web/src/app/page.tsx` | `HASEELA/Haseela WEB/screen-overview.jsx` | Yes | P1 |
| `/transactions` | `apps/web/src/app/transactions/page.tsx` | `screen-transactions.jsx`, `forms.jsx` | Yes | P1 |
| `/clients` | `apps/web/src/app/clients/page.tsx` | `screen-clients.jsx`, `forms.jsx` | Yes | P1 |
| `/subscriptions` | `apps/web/src/app/subscriptions/page.tsx` | `screen-subscriptions.jsx`, `forms.jsx` | Yes | P1 |
| `/analytics` | `apps/web/src/app/analytics/page.tsx` | `screen-analytics.jsx`, `charts.jsx` | Yes | P1 |
| `/archive` | `apps/web/src/app/archive/page.tsx` | `screen-money.jsx` archive section | Yes | P2 |
| `/settings` | `apps/web/src/app/settings/page.tsx` | `screen-settings.jsx` settings section | Partial | P2 |
| `/login` | `apps/web/src/app/login/page.tsx` | `screen-auth.jsx` | Yes | P1 |
| `/register` | `apps/web/src/app/register/page.tsx` | `screen-auth.jsx` | Yes | P1 |
| `/offline` | `apps/web/src/app/offline/page.tsx` | `screen-util.jsx` | Yes | P3 |

## Future Screens Requiring Backend Or Separate Approval

| Future route | HASEELA reference | Backend required | Notes |
|---|---|---|---|
| `/invoices` | `screen-invoices.jsx` | Yes | Needs Invoice and InvoiceItem models, APIs, PDF/export flow. |
| `/reports` | `screen-money.jsx` reports section | Yes | Needs server-side export APIs. |
| `/notifications` | `screen-money.jsx` notifications section | Yes | Needs Notification model/API. |
| `/profile` | `screen-settings.jsx` profile section | Partial | Needs user profile persistence and Supabase account flows. |
| `/onboarding` | `screen-onboarding.jsx` | Yes | Needs onboarding state and first-run routing. |
| `/forgot` | `screen-auth.jsx` | Partial | Needs Supabase reset flow UI. |
| `/reset` | `screen-auth.jsx` | Partial | Needs Supabase reset callback handling. |
| `/pricing` | `screen-settings.jsx` pricing section | Yes | Needs business decision and payment provider. |
| `/billing` | `screen-settings.jsx` billing section | Yes | Needs payment provider integration. |

## Component Mapping

| HASEELA prototype | Production target |
|---|---|
| `tokens.css` | `apps/web/src/app/globals.css`, `apps/web/tailwind.config.js` |
| `components.jsx` Button | `apps/web/src/components/ui/Button.tsx` |
| `components.jsx` Field/Input/Select/Textarea | `apps/web/src/components/ui/Form.tsx` or separate files |
| `components.jsx` Badge/FilterChip | `apps/web/src/components/ui/Badge.tsx`, `FilterChip.tsx` |
| `components.jsx` Card/StatCard | `apps/web/src/components/ui/Card.tsx`, `StatCard.tsx` |
| `components.jsx` Modal/Drawer/ConfirmDialog | `apps/web/src/components/ui/Modal.tsx`, `Drawer.tsx`, `ConfirmDialog.tsx` |
| `components.jsx` ToastProvider | Consider `apps/web/src/components/feedback/ToastProvider.tsx` only if needed |
| `shell.jsx` Sidebar/Topbar | `apps/web/src/components/layout/*` or current components |
| `shell.jsx` CommandPalette | `apps/web/src/components/layout/CommandPalette.tsx` |
| `charts.jsx` | `apps/web/src/components/charts/*` |
| `forms.jsx` | `apps/web/src/components/forms/*` or feature-specific forms |

## Port Order

1. Tokens and theme variables.
2. UI primitives.
3. App shell.
4. Auth layout.
5. Dashboard.
6. Transactions.
7. Clients/subscriptions.
8. Analytics/archive/settings.
9. Utility pages.

## Navigation Rule

Do not add active navigation links for future screens until their backend and production route exist.

Allowed exception: a disabled or explicitly marked `Coming soon` item in a non-primary area, if approved.
