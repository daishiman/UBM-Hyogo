# Documentation Changelog

Date: 2026-05-25

## Changed

- Reclassified workflow from `spec_completed` to `implemented_local_evidence_captured`.
- Corrected Issue #894 state to CLOSED and fixed PR wording boundary to `Refs #894`.
- Expanded scope from 2 AdminPageHeader pages to all 8 admin page-local breadcrumb consumers.
- Added Phase 11 physical evidence files and Phase 12 strict 7 outputs.
- Added authenticated admin Playwright screenshot evidence for the breadcrumb responsibility split.
- Added aiworkflow-requirements same-wave inventory entries.

## Verification

- `mise exec -- pnpm exec vitest run "apps/web/app/(admin)/layout.spec.tsx"` PASS.
- `mise exec -- pnpm exec vitest run "apps/web/src/components/admin/__tests__/Breadcrumb.spec.tsx"` PASS.
- `mise exec -- pnpm typecheck` PASS.
- `mise exec -- pnpm lint` PASS.
- `grep -rn 'label: "管理"' "apps/web/app/(admin)/admin/" || echo '0 hit'` PASS.
