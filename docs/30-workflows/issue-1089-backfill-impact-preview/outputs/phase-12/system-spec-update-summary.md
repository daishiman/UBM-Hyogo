# System Spec Update Summary — issue-1089 backfill impact preview

## Step 1-A: 完了タスク記録

- `issue-1089-backfill-impact-preview` は `implemented_local_runtime_pending / implementation / VISUAL_ON_EXECUTION` として同期対象。
- 実装対象は `apps/api/src/jobs/sync-forms-responses.ts`, `apps/api/src/routes/admin/responses-sync.ts`, `apps/web/src/features/admin/diagnostics/manual-sync.ts`, `apps/web/src/features/admin/components/_sync/ManualFormResyncPanel.client.tsx`。
- テスト対象は backend contract 2 ファイル、frontend schema/UI 2 ファイル。

## Step 1-B: 実装状況

`spec_created` ではなく、実コード差分と focused tests を伴う **implemented_local_runtime_pending** とする。runtime screenshot、staging deploy、`SYNC_ADMIN_TOKEN` 投入、commit、push、PR は user-gated。

## Step 1-C: 関連タスク

- 親 Task B: `ManualFormResyncPanel` の既存手動再取込 UI。
- 参考正本: `BackfillPublishStatePanel` の `?dryRun=true|false` staged dry-run pattern。
- 本タスク: `POST /admin/sync/responses?dryRun=true&fullSync=true` と `ResponseSyncPreview` を追加し、全件 backfill 前の実数プレビューを UI に表示する。

## Step 2: 正本仕様への反映

更新要。`aiworkflow-requirements` の API 正本へ以下を同一 wave で反映した。

- `POST /admin/sync/responses` は既存 `fullSync` / `cursor` に加え、opt-in query `dryRun=true` を受け付ける。
- dry-run 応答は `{ ok:true, preview:{ status:"preview", dryRun:true, responseCount, estimatedWrites, pagesScanned, capped } }`。
- dry-run は read-only で、lock / sync_jobs ledger / D1 write / `processResponse` を実行しない。
- frontend は `SyncPreviewResultSchema` / `SyncPreviewRunResponseSchema` を zod で再宣言し、既存 `SyncResultSchema` は不変。

## Same-Wave Sync

- `.claude/skills/aiworkflow-requirements/references/api-endpoints.md` を更新。
- `.claude/skills/aiworkflow-requirements/SKILL-changelog.md` を更新。
- `.claude/skills/task-specification-creator/SKILL-changelog.md` を更新。

