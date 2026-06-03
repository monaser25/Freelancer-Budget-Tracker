# Agent Report

Status: Completed
Scope: Plan Mode - Design System Migration
Files changed: None (Plan Mode)
Decisions made:
- Map old `globals.css` variable names (e.g., `--card-bg`, `--text-primary`) to the new HASEELA tokens (e.g., `--surface`, `--text`) to ensure backward compatibility for MVP screens that are not yet migrated.
- Use pure React components combined with Tailwind for complex components (`Modal`, `Drawer`, `Menu`) mimicking the HASEELA prototype, rather than introducing new heavy dependencies like Radix UI, aligning with the "No new dependency without approval" rule.
- Use `lucide-react` (already installed) as the standard icon source.
- The default font will be changed from `DM Sans` to `Inter` to match HASEELA tokens.

Risks:
- `apps/web/src/app/globals.css` and `apps/web/tailwind.config.js` are highly risky because they impact the entire app globally. Direct replacement of variable hex codes will immediately affect unmigrated pages. Careful aliasing is required.
- Building custom `Modal` and `Drawer` with pure React poses an accessibility risk (focus management, ARIA roles). It is recommended to evaluate if `@radix-ui/react-dialog` is permissible, otherwise we must carefully implement focus trapping.

Tests run: None (Plan Mode)
Screenshots/visual notes: N/A
Remaining work: Execute the Build Mode for Phase 1.

## Token Mapping Plan

New root variables to add to `globals.css`:

- Brand: `--accent`, `--accent-hover`, `--accent-tint`, `--accent-fg`
- Surface/neutral: `--bg`, `--surface`, `--surface-elevated`, `--surface-hover`, `--border`, `--border-strong`, `--text`, `--text-secondary`, `--text-muted`
- Semantic: `--positive`, `--negative`, `--warning`, `--info` and their `-tint` counterparts
- Data viz: `--viz-1` through `--viz-7`
- Radius: `--r-sm`, `--r-md`, `--r-lg`, `--r-xl`, `--r-full`
- Shadows: `--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--ring`
- Motion: `--dur-fast`, `--dur-base`, `--dur-slow`, `--ease-out`, `--ease-in`
- Dark mode versions under `.dark` selector

Backward compatibility variables to alias:

```css
--sidebar-bg: var(--surface);
--card-bg: var(--surface);
--text-primary: var(--text);
--accent-light: var(--accent-tint);
```

Note: do not redefine `--border`, `--text-secondary`, or `--text-muted` as self-referential aliases.

## Proposed Component List And Implementation Order

1. Tokens and theming:
   - `apps/web/src/app/globals.css`
   - `apps/web/tailwind.config.js`

2. Core primitives under `apps/web/src/components/ui/`:
   - `Icon.tsx` wrapper around `lucide-react`
   - `Button.tsx` including `IconButton`
   - `Badge.tsx` including `FilterChip`, `DeltaChip`
   - `Card.tsx` including `StatCard`, `SectionHeader`
   - `Avatar.tsx`
   - `Skeleton.tsx`

3. Form primitives:
   - `Field.tsx`
   - `Input.tsx`
   - `Select.tsx`
   - `Textarea.tsx`
   - `Switch.tsx`
   - `Segmented.tsx`
   - `StrengthMeter.tsx`

4. Layout/overlay primitives:
   - `Modal.tsx`
   - `Drawer.tsx`
   - `Menu.tsx`
   - `EmptyState.tsx`

5. Feedback primitives:
   - `ToastProvider.tsx`
   - `useToast.ts`

## Dependency Concerns

- The custom implementations of `Modal`, `Drawer`, and `Menu` in `components.jsx` lack full accessibility features such as focus trap and robust keyboard navigation.
- `@radix-ui/react-dialog` or `@headlessui/react` would provide safer accessible primitives if approved, but no new dependency should be added in Phase 1.
- Missing `framer-motion` is not a blocker. Use CSS transitions and keyframes from `tokens.css`.
