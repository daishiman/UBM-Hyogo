# Artifact Inventory — 06c-B-admin-members

## canonical root

`docs/30-workflows/completed-tasks/06c-B-admin-members/`

## workflow state

| field | value |
| --- | --- |
| workflow_state | `implemented-local` |
| taskType | `implementation` |
| docs scope | `false` |
| remaining scope | `false` |
| visual evidence | `VISUAL_ON_EXECUTION`（08b / 09a 委譲） |

## root artifacts

| artifact | status |
| --- | --- |
| `index.md` | present |
| `artifacts.json` | present |
| `phase-01.md` ... `phase-13.md` | present |

## phase 12 required artifacts

| artifact | status |
| --- | --- |
| `outputs/phase-12/main.md` | present |
| `outputs/phase-12/implementation-guide.md` | present |
| `outputs/phase-12/system-spec-update-summary.md` | present |
| `outputs/phase-12/documentation-changelog.md` | present |
| `outputs/phase-12/unassigned-task-detection.md` | present |
| `outputs/phase-12/skill-feedback-report.md` | present |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | present |

## implementation source-of-truth

| layer | path |
| --- | --- |
| API list / detail / delete / restore | `apps/api/src/routes/admin/members.ts`, `apps/api/src/routes/admin/member-delete.ts` |
| Web Server Component | `apps/web/app/(admin)/admin/members/page.tsx` |
| Web Client Component | `apps/web/src/components/admin/MembersClient.tsx` |
| shared schema / helper | `packages/shared/src/admin/search.ts`, `packages/shared/src/zod/viewmodel.ts`, `packages/shared/src/types/viewmodel/index.ts` |
| API tests | `apps/api/src/routes/admin/members.test.ts`, `apps/api/src/routes/admin/member-delete.test.ts` |
| manual spec | `docs/00-getting-started-manual/specs/07-edit-delete.md`（`POST /api/admin/members/[id]/delete`） |

## scope notes

- admin member detail UI は `/admin/members` 右ドロワーを canonical とし、別 route `/admin/members/[id]` は新設しない。
- list response は `{ total, members }` を維持し、`page` / `pageSize` は optional 追加で互換を保つ。
- `filter` 語彙は `published | hidden | deleted` を canonical とし、stale な `active|hidden|deleted` を撤回する。
- audit table 名は単数形 `audit_log` を canonical とし、`POST /api/admin/members/[id]/delete` / `restore` は `auditAppend()` 経由で `admin.member.deleted` / `admin.member.restored` を append する。
- runtime visual evidence は 08b admin Playwright E2E / 09a staging smoke へ委譲（staging admin Google account + sanitized D1 fixture 前提）。
- role mutation UI/API、CSV export、bulk operation、admin user invitation は 06c-B では scope out。
