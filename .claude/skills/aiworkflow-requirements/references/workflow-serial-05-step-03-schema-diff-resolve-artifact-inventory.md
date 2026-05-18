# workflow artifact inventory — serial-05-step-03 schema-diff-resolve UI

| Field | Value |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/serial-05-step-03-schema-diff-resolve/` |
| parent workflow | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/serial-05-admin-mutation-ui/` |
| source spec | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/serial-05-admin-mutation-ui/step-03-schema-diff-resolve/spec.md` |
| state | `completed / implementation / VISUAL / PASS` |
| evidence completion workflow | `docs/30-workflows/completed-tasks/issue-775-serial-05-step-03-runtime-evidence-completion/` |

## Primary files

| Path | Role |
| --- | --- |
| `apps/web/src/components/admin/SchemaDiffPanel.tsx` | 4-pane schema diff UI, client-side stableKey regex validation, data-feedback-kind switching |
| `apps/web/src/lib/admin/api.ts` | `postSchemaAlias()` browser proxy + retryable continuation predicate |
| `apps/web/src/components/admin/__tests__/SchemaDiffPanel.component.spec.tsx` | render / selection / validation / 200・202・409・422 feedback tests |
| `apps/web/src/lib/admin/__tests__/api.spec.ts` | `postSchemaAlias()` + retryable predicate regression test |
| `docs/00-getting-started-manual/specs/01-api-schema.md` | `/admin/schema/diff` `/admin/schema/aliases` contract row |
| `docs/00-getting-started-manual/specs/11-admin-management.md` | admin schema resolve UI contract row |

## Evidence

| Path | Role |
| --- | --- |
| `docs/30-workflows/completed-tasks/serial-05-step-03-schema-diff-resolve/outputs/phase-11/evidence/typecheck.log` | typecheck EXIT_CODE=0 |
| `docs/30-workflows/completed-tasks/serial-05-step-03-schema-diff-resolve/outputs/phase-11/evidence/lint.log` | lint EXIT_CODE=0 |
| `docs/30-workflows/completed-tasks/serial-05-step-03-schema-diff-resolve/outputs/phase-11/evidence/test.log` | focused tests PASS |
| `docs/30-workflows/completed-tasks/serial-05-step-03-schema-diff-resolve/outputs/phase-11/evidence/build.log` | build evidence |
| `docs/30-workflows/completed-tasks/serial-05-step-03-schema-diff-resolve/outputs/phase-11/evidence/grep-gate.log` | HEX / bg-[#xxx] / process.env 直接参照 gate |
| `docs/30-workflows/completed-tasks/serial-05-step-03-schema-diff-resolve/outputs/phase-11/evidence/playwright.log` | Issue #775 Playwright visual evidence `11 passed / 3 skipped` |
| `docs/30-workflows/completed-tasks/serial-05-step-03-schema-diff-resolve/outputs/phase-11/screenshots/*.png` | 11 fixture-backed local runtime PNG; legacy placeholder excluded |
| `docs/30-workflows/completed-tasks/serial-05-step-03-schema-diff-resolve/outputs/phase-11/manifest.json` | screenshots.status="completed", pass=true, verdict=PASS |
| `docs/30-workflows/completed-tasks/serial-05-step-03-schema-diff-resolve/outputs/phase-12/phase12-task-spec-compliance-check.md` | Phase 12 strict 7 compliance |
| `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-serial-05-step-03-schema-diff-resolve-2026-05.md` | lessons learned (L-S5S3-001..005) |
