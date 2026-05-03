# 06b-C `/profile` Logged-in Visual Evidence Artifact Inventory

## Metadata

| Item | Value |
| --- | --- |
| Task ID | 06b-C-profile-logged-in-visual-evidence |
| Workflow | `docs/30-workflows/06b-C-profile-logged-in-visual-evidence/` |
| Status | implementation-prepared / implementation-spec / VISUAL_ON_EXECUTION |
| Sync date | 2026-05-03 |
| Phase 11 | PENDING_RUNTIME_EVIDENCE (storageState + execution required) |
| Phase 12 | strict 7 files present |
| Phase 13 | pending_user_approval |

## Current Facts

| Area | Artifact |
| --- | --- |
| Playwright spec | `apps/web/playwright/tests/profile-readonly.spec.ts` (M-08 / M-09 / M-10 / M-16 desktop+mobile) |
| Playwright config | `apps/web/playwright.config.ts` (`staging` project, `PLAYWRIGHT_STAGING_BASE_URL`, optional `storageState`) |
| Capture wrapper | `scripts/capture-profile-evidence.sh` (production URL guard, storageState exit 4 guard) |
| Auth state dir | `apps/web/playwright/.auth/.gitkeep` (state JSON ignored via `.gitignore`) |
| Evidence dirs | `docs/30-workflows/06b-C-profile-logged-in-visual-evidence/outputs/phase-11/{screenshots,dom}/.gitkeep` |
| Workflow artifacts | `docs/30-workflows/06b-C-profile-logged-in-visual-evidence/outputs/phase-12/` (7 files) |

## Contract

- Capture wrapper rejects production origin (any host matching the production deploy URL) and exits non-zero before invoking Playwright.
- Capture wrapper exits 4 when `--storage-state` path is absent, distinguishing "not_executed" from "infra failure".
- `apps/web/playwright/.auth/*.json` is ignored by `.gitignore`; only `.gitkeep` is committed.
- `evidence_status` for Phase 11 takes one of: `not_implemented` / `PENDING_RUNTIME_EVIDENCE` / `captured`.
- Runtime screenshot capture is delegated to `task-06b-c-profile-logged-in-runtime-evidence-execution-001` (user-approved gate).

## Evidence Path Map

| Marker | Output |
| --- | --- |
| M-08 | `outputs/phase-11/screenshots/M-08-{desktop,mobile}-{date}.png` |
| M-09 | `outputs/phase-11/dom/M-09-no-form-{desktop,mobile}.json` |
| M-10 | `outputs/phase-11/dom/M-10-edit-query-ignored-{desktop,mobile}.json` + `outputs/phase-11/screenshots/M-10-{desktop,mobile}-{date}.png` |
| M-14 | Magic Link end-to-end (deferred to runtime execution task) |
| M-15 | Google OAuth end-to-end (deferred to runtime execution task) |
| M-16 | Logout redirect assertion in `profile-readonly.spec.ts` |

## Phase 12 Required Files

| File | Status |
| --- | --- |
| `outputs/phase-12/main.md` | present |
| `outputs/phase-12/implementation-guide.md` | present |
| `outputs/phase-12/system-spec-update-summary.md` | present |
| `outputs/phase-12/documentation-changelog.md` | present |
| `outputs/phase-12/unassigned-task-detection.md` | present |
| `outputs/phase-12/skill-feedback-report.md` | present |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | present |

## Related Resources

- `indexes/quick-reference.md` (06b row, profile logged-in visual evidence follow-up)
- `indexes/resource-map.md` (06b-C row)
- `references/task-workflow-active.md` (06b-C row)
- `references/legacy-ordinal-family-register.md` (UT-06B → 06b-C alias)
- `references/lessons-learned-06b-profile-logged-in-visual-evidence-2026-04.md` (L-06B-001〜008)
- `changelog/20260503-06b-C-profile-logged-in-visual-evidence.md`
- Unassigned (runtime execution): `docs/30-workflows/unassigned-task/task-06b-c-profile-logged-in-runtime-evidence-execution-001.md`
