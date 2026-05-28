# workflow-admin-requests-prototype-alignment-and-404-fix Artifact Inventory

## Metadata

| Field | Value |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/admin-requests-prototype-alignment-and-404-fix/` |
| status | `implemented_local_evidence_captured / implementation / VISUAL / staging runtime pending_user_approval` |
| parent workflow | `docs/30-workflows/completed-tasks/admin-ui-prototype-alignment/` |
| date | 2026-05-27 |

## Workflow Files

| Path | Role |
| --- | --- |
| `index.md` | Root workflow summary and Phase table |
| `artifacts.json` | Root metadata, gates, dependencies, and phase outputs |
| `outputs/artifacts.json` | Mirror metadata; must remain byte-identical to root `artifacts.json` |
| `outputs/phase-1/phase-1.md` | Requirements and acceptance criteria |
| `outputs/phase-2/phase-2.md` | API 404 and UI alignment design |
| `outputs/phase-3/phase-3.md` | Design review and 4-condition gate |
| `outputs/phase-4/phase-4.md` | Test creation plan |
| `outputs/phase-5/phase-5.md` | Implementation plan |
| `outputs/phase-6/phase-6.md` | Test expansion plan |
| `outputs/phase-7/phase-7.md` | Coverage plan |
| `outputs/phase-8/phase-8.md` | Refactor plan |
| `outputs/phase-9/phase-9.md` | QA plan |
| `outputs/phase-10/phase-10.md` | Final review plan |
| `outputs/phase-11/phase-11.md` | Manual/runtime evidence plan |
| `outputs/phase-12/phase-12.md` | Legacy Phase 12 planning narrative |
| `outputs/phase-13/phase-13.md` | User-gated PR procedure |
| `tasks/task-A-api-404-fix.md` | API 404 root-cause fix task specification |
| `tasks/task-B-ui-prototype-alignment.md` | Admin requests UI prototype alignment task specification |

## Phase 12 Strict 7

| File | Status |
| --- | --- |
| `outputs/phase-12/main.md` | present |
| `outputs/phase-12/implementation-guide.md` | present |
| `outputs/phase-12/system-spec-update-summary.md` | present |
| `outputs/phase-12/documentation-changelog.md` | present |
| `outputs/phase-12/unassigned-task-detection.md` | present |
| `outputs/phase-12/skill-feedback-report.md` | present |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | present |

## Implemented Targets

| Path | Planned Action |
| --- | --- |
| `apps/api/src/routes/admin/requests.contract.spec.ts` | Added non-admin 403 and `delete_request` list coverage |
| `apps/api/src/routes/admin/requests.mount.spec.ts` | Added worker-entry mount drift gate for GET and resolve POST |
| `apps/web/app/(admin)/admin/requests/page.tsx` | Aligned page wrapper/head structure with admin prototype primitives |
| `apps/web/src/components/admin/RequestQueuePanel.tsx` | Aligned filter/list shell with `card`, `card-pad`, `h-section`, `h-card`, `btn-row` |
| `apps/web/src/components/admin/RequestQueueDetail.tsx` | Aligned detail/empty states with `card`, `card-flat`, `h-card`, `btn-row` |
| `apps/web/src/components/admin/RequestConfirmDialog.tsx` | Aligned dialog actions with `btn-row` |
| `apps/web/src/styles/globals.css` | Added prototype primitive class support using existing token values |
| `apps/web/playwright/tests/admin-requests.spec.ts` | Added local authenticated screenshot evidence gate |
| `apps/web/playwright/tests/visual-staging/admin-requests.spec.ts` | Added user-gated staging visual baseline path |

## Local Evidence

| Path | Status |
| --- | --- |
| `outputs/phase-11/screenshots/admin-requests-visibility-populated-linux.png` | present |
| `outputs/phase-11/playwright-report/results.json` | present |
| `outputs/phase-11/monocart/index.json` | present |

## Boundary

No API route surface, D1 schema, external mutation, commit, push, or PR is
completed by this inventory. Staging deploy, staging curl 200, and authenticated
staging Playwright visual baseline remain user-gated runtime actions.

## Lessons Learned

| ID | 要約 |
| --- | --- |
| L-ADMREQ-001 | contract spec は createXxxRoute() 直叩きのため worker entry mount drift を見落とす → `*.mount.spec.ts` で `worker.fetch` 経由 dispatch を保証 |
| L-ADMREQ-002 | Phase 11 evidence status enum は `present\|pending\|n/a` のみ。user-gated 未撮影は `pending` と書く |
| L-ADMREQ-003 | route page が primary h1 を所有・panel は hidden h2 + aria-labelledby で role 分担 |
| L-ADMREQ-004 | local screenshot は `ADMIN_REQUESTS_EVIDENCE=1` + `PLAYWRIGHT_EVIDENCE_DIR` で env-gated 起動し CI matrix を汚さない |
| L-ADMREQ-005 | dual-task (UI + API) 1 サイクルでは root/outputs `artifacts.json` mirror を byte-identical に保つ (cmp で検証) |

正本: `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-admin-requests-prototype-alignment-and-404-fix-2026-05.md`
