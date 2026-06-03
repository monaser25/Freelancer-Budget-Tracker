# Decisions Log

## D001: Product Name

Decision: The product name is **Haseela**.

Impact:

- UI copy and portfolio docs should move toward Haseela.
- Internal legacy names can remain temporarily if renaming would risk behavior.

## D002: Platform Priority

Decision: Web first, mobile later.

Impact:

- No mobile app implementation until web is production-grade.
- HASEELA mobile files remain design reference only.

## D003: HASEELA Prototype Usage

Decision: HASEELA prototype is reference-only.

Impact:

- Do not copy prototype app architecture into production.
- Convert visual patterns into typed Next/React components.

## D004: Backend Scope For V1

Decision: V1 should focus on backend-supported MVP screens.

Impact:

- Invoices, reports, notifications, onboarding, pricing, and billing are deferred unless explicitly approved.

## D005: Agent Workflow

Decision: Use multiple agents with strict scopes and reports.

Impact:

- Plan agents can run in parallel.
- Build agents run in sequence for foundation work.
- Page agents can run in parallel only after foundation is approved and file ownership does not overlap.

## D006: Production Data Rule

Decision: No mock data in production screens.

Impact:

- Any HASEELA screen without backend support is not included as a live production feature.

## D007: Git Safety

Decision: No commits, force pushes, resets, or production deploy changes without explicit approval.

Impact:

- Agents should leave changes for review.
- Tech lead controls merges and release steps.
