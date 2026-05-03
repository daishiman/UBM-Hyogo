# Artifact Inventory — 06c-C-admin-tags

## canonical root

`docs/30-workflows/completed-tasks/06c-C-admin-tags/`

## workflow state

| field | value |
| --- | --- |
| workflow_state | `implemented-local` |
| taskType | `implementation-spec` |
| docs scope | `true` |
| remaining scope | `true` |
| visual evidence | `VISUAL_ON_EXECUTION`（08b admin Playwright E2E / 09a staging smoke 委譲） |

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
| `outputs/phase-12/unassigned-task-detection.md` | present（0 new unassigned tasks）|
| `outputs/phase-12/skill-feedback-report.md` | present |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | present |
| `outputs/phase-12/elegant-review-30-methods.md` | present（拡張 review evidence）|

## phase 11 evidence

| artifact | status |
| --- | --- |
| `outputs/phase-11/runtime-evidence-handoff.md` | present（`PENDING_RUNTIME_FOLLOW_UP`、08b/09a を canonical handoff 先と宣言）|
| `outputs/phase-11/screenshots/admin-tags.png` | absent（authenticated admin session + D1 fixture 必須のため 06c-C 単独不可、08b で取得）|

## implementation source-of-truth

| layer | path |
| --- | --- |
| Web Server Component | `apps/web/app/(admin)/admin/tags/page.tsx` |
| Web Client Component | `apps/web/src/components/admin/TagQueuePanel.tsx` |
| Playwright POM | `apps/web/playwright/page-objects/AdminTagsPage.ts` |
| Playwright spec | `apps/web/playwright/tests/admin-pages.spec.ts` |
| shared schema (queue resolve) | `packages/shared/src/admin/tag-queue.ts`（`tagQueueResolveBodySchema`）|
| API queue list | `apps/api/src/routes/admin/tag-queue.ts` |
| API queue resolve | `apps/api/src/routes/admin/tag-queue-resolve.ts` |
| manual spec (queue 境界) | `docs/00-getting-started-manual/specs/12-search-tags.md` |
| manual spec (admin 境界) | `docs/00-getting-started-manual/specs/11-admin-management.md` |

## scope notes

- `/admin/tags` は **未タグ会員割当キュー UI (queue-only)** が canonical。タグ辞書 CRUD / alias editor / `member_tags` 直接編集 UI/API は scope out。
- `TagQueueStatus` は `queued | reviewing | resolved | rejected | dlq` の 5 値（issue-109 DLQ 列と整合）。
- `TERMINAL_STATUSES = {resolved, rejected, dlq}` は `TagQueuePanel` から export し、page.tsx は import で型 single-source-of-truth を維持。
- API は `GET /admin/tags/queue` + `POST /admin/tags/queue/:queueId/resolve` のみ正本。`tagQueueResolveBodySchema` を契約源泉とし、`confirmed` body は `tagCodes` 必須、`rejected` body は `reason` 必須、混在 body は 400。
- POM `data-testid` 契約: `admin-tag-queue-list` / `admin-tag-review-panel` / `role=group` `name="ステータス絞込"`。旧 `admin-tag-list` / `admin-add-tag-button` は撤回済み。
- runtime visual evidence は 08b admin Playwright E2E / 09a staging smoke へ委譲（authenticated admin Google account + sanitized D1 fixture 前提）。
- `apps/web` から D1 / API repository の直接参照禁止（不変条件 #5 維持）。Server Component は `fetchAdmin('/admin/tags/queue?...')` のみを使用。
