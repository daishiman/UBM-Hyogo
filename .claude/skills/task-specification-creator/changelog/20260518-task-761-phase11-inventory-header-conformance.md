# 2026-05-18 task-761 Phase 11 inventory header conformance reflection

- `docs/30-workflows/completed-tasks/task-761-visual-full-required-status-check/outputs/phase-12/phase12-task-spec-compliance-check.md` was using a 2-column `Evidence | Verdict` table that the Phase 11 evidence parser (`scripts/lib/phase12-compliance/parse-phase11-evidence.ts`) cannot read, so `pnpm verify:phase12-compliance` and the pre-push `phase12-compliance-guard` hook returned `missing-evidence` with `<empty-or-missing-table>`.
- Re-confirmed canonical schema from `references/phase12-compliance-check-template.md`: `Classification | Path | Status` (lowercase), `Status` ∈ `{present, pending, n/a}`, `Path` must be a workflow-root-relative path that resolves to an existing file.
- Migrated the task-761 inventory to the canonical schema, pointing rows at the actual files under `outputs/phase-11/evidence/`. Verifier now passes.
- No template change needed — SSOT was already correct. Recording this here so future task closeouts copy the canonical 3-column form from the start rather than reinventing 2-column variants.

`pnpm verify:phase12-compliance` passes locally. Commit, push, PR, and Issue mutation remain user-gated.
