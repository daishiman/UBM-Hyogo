# Phase 8 — Refactor / Elegance Check

## Decision

Patch current components, do not discard the existing shell system.

## Rationale

- `AuthView` is a small boundary object that removes repeated session branching without introducing a global provider.
- `resolveAuthView()` isolates pure branching and keeps `getAuth().auth()` inside server-only helper code.
- `safeNext()` is a separate pure function because redirect safety is security-sensitive and independent from header rendering.
- Moving `/`, `/privacy`, or `/terms` into `(public)` is rejected because it adds route-topology risk without reducing meaningful complexity.
- AdminSidebar already has a home link; Task F must rename/reposition rather than duplicate when the existing `href="/"` item is present.

## Over-Engineering Rejected

- No new API endpoint.
- No D1 access from `apps/web`.
- No React context/provider for auth slot state.
- No broad visual baseline update until Task G can prove runtime DOM contracts.
