# Agent Report

Status: Completed
Scope: Plan Mode - Analyze the app shell and auth migration.
Files changed: None (Plan Mode restricted)
Decisions made:
- Mapped current production shell/auth to HASEELA designs.
- Identified UI primitives to extract (`AuthLayout`, `PasswordInput`).
- Determined which features to port and which to defer based on backend readiness.
- Created a file ownership plan to avoid merge conflicts.

Risks:
- `Topbar.tsx` currently contains the New Transaction modal logic. Refactoring it to match the HASEELA New dropdown might bloat the file or break the modal.
- Mobile responsive behavior needs care: current production uses a bottom nav for mobile, while HASEELA uses a hidden sidebar. We should either maintain the bottom nav or port a proper mobile drawer.
- Supabase auth behavior and `AuthGate` routing are sensitive. Refactoring UI must not break session listeners or DevAuth bypass.

Tests run: None (Plan Mode)
Screenshots/visual notes:
- The HASEELA `screen-auth.jsx` split layout with the dark left panel and statistics is a major visual upgrade that should be ported.
- The `shell.jsx` collapsible sidebar feature and user dropdown menu are useful quality-of-life improvements.

Remaining work:
- Implementation phase for Auth UI.
- Implementation phase for App Shell UI.

## Detailed Plan

### Current Shell/Auth Structure

- `AppShell.tsx` wraps the app in `AuthProvider` and `AuthGate`. It handles unauthenticated redirects and mounting `Sidebar`, `Topbar`, and `FinancialBootstrap`.
- `Sidebar.tsx` renders a desktop left sidebar and a mobile bottom nav.
- `Topbar.tsx` renders dynamic page titles and houses a New Transaction modal.
- `AuthProvider.tsx` manages Supabase state and DevAuth logic.
- `login/page.tsx` and `register/page.tsx` handle basic forms, error states, and email confirmation rate limits.

### HASEELA Shell/Auth Features Worth Porting

1. Auth UI:
   - Split-screen `AuthLayout` with premium brand panel.
   - Better typography.
   - `PasswordInput` with show/hide toggle.
   - `InlineAlert`.

2. Sidebar:
   - Collapsible state (`var(--sidebar-rail)` vs `var(--sidebar-w)`).
   - Cleaner navigation items with active indicator bars.
   - Bottom user profile dropdown menu using a generic `Menu` component.

3. Topbar:
   - Cleaner title layout.
   - Dark/light mode toggle after theme foundation exists.
   - New button dropdown only after the `Menu` primitive exists.

### What Should Be Done First

1. Auth polish:
   - Port `AuthLayout` wrapper and `PasswordInput` to login/register.
   - Preserve email rate limit and error handling logic.

2. Sidebar visuals:
   - Apply HASEELA color tokens, hover states, and structural layout.
   - Implement user menu dropdown only if `Menu` exists.

3. Topbar visuals:
   - Apply cleaner title layout.
   - Update New Transaction button styling.

### What Should Be Deferred

- Advanced command palette.
- Notifications bell.
- Invoices in the New menu.
- Profile/Billing settings in user menu.
- Forgot password, reset password, and onboarding flows.

### File Ownership Plan

- Agent A Auth Pages:
  - `apps/web/src/app/login/page.tsx`
  - `apps/web/src/app/register/page.tsx`
  - `apps/web/src/components/layout/AuthLayout.tsx`

- Agent B Shell Structure:
  - `apps/web/src/components/AppShell.tsx`
  - `apps/web/src/components/Sidebar.tsx`
  - `apps/web/src/components/Topbar.tsx`

These agents must run sequentially if they need to touch shared CSS/Tailwind, or parallel only if strictly confined to non-overlapping files.
