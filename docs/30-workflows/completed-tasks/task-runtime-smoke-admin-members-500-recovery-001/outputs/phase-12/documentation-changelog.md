# Phase 12: Documentation Changelog

| Date | File | Change |
| --- | --- | --- |
| 2026-05-21 | `artifacts.json` / `outputs/artifacts.json` | Synchronized root/output artifacts parity for `runtime_pending` / `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` |
| 2026-05-21 | `outputs/phase-12/*` | Added strict 7 Phase 12 files and canonical compliance check |
| 2026-05-21 | `phase-05.md` / `phase-06.md` / `phase-11.md` / `phase-12.md` | Aligned smoke runner body visibility implementation and evidence wording |
| 2026-05-21 | `apps/api/src/routes/admin/members.ts` | Added defensive enum normalization, legacy `published/private` mapping, structured error code, and DB binding 503 guard |
| 2026-05-21 | `apps/api/src/routes/admin/members.contract.spec.ts` | Added recovery coverage for DB binding absence, enum drift, legacy publish states, consent drift, and zod failure safe body |
| 2026-05-21 | `.claude/skills/aiworkflow-requirements/*` | Registered workflow in quick-reference, resource-map, active workflow, artifact inventory, changelog, and lessons |
| 2026-05-21 | `.claude/skills/task-specification-creator/references/phase12-skill-feedback-promotion.md` | Promoted runtime smoke recovery body-visibility rule |
| 2026-05-21 | `scripts/smoke/runtime-attendance-provider.sh` | Added redacted non-200 body persistence |
| 2026-05-21 | `scripts/smoke/__tests__/runtime-attendance-provider.test.sh` | Added fake-curl regression for admin-list failure body and redaction |
