# 2026-06-05 issue-1089-backfill-impact-preview

`issue-1089-backfill-impact-preview` を `implemented_local_runtime_pending / implementation / VISUAL_ON_EXECUTION` として同期した。

- Added backend read-only count-only path: `ResponseSyncPreview` + `previewResponseSync` in `apps/api/src/jobs/sync-forms-responses.ts`.
- Added `POST /admin/sync/responses?dryRun=true` preview branch in `apps/api/src/routes/admin/responses-sync.ts`, returning `{ ok:true, preview:{ status:"preview", dryRun:true, responseCount, estimatedWrites, pagesScanned, capped } }`.
- Added frontend `SyncPreviewResultSchema` / `SyncPreviewRunResponseSchema` (zod re-declaration) in `apps/web/src/features/admin/diagnostics/manual-sync.ts`; existing `SyncResultSchema` unchanged.
- Added staged dry-run preview UI (`preview` → count panel → `canBackfill` gate → destructive confirm) to `apps/web/src/features/admin/components/_sync/ManualFormResyncPanel.client.tsx`, mirroring the `BackfillPublishStatePanel` `?dryRun=true|false` pattern.
- dry-run is read-only: no sync lock, no `sync_jobs` ledger entry, no D1 write, no `processResponse`. `responseCount` is the real `forms.responses.list` count (AC-2); `estimatedWrites` is labeled an estimate.
- Verified focused tests 4 files / 71 tests PASS (apps/api 40 + apps/web 31), web/api typecheck PASS, lint PASS, no HEX literals, verify:phase12-compliance PASS, gate-metadata ERROR 0.
- Same-wave sync: `references/api-endpoints.md`, `SKILL.md` / `SKILL-changelog.md`, `task-specification-creator/SKILL.md` / `SKILL-changelog.md`, `references/task-workflow-active.md`, dedicated artifact inventory, `indexes/resource-map.md` / `quick-reference.md`, `indexes/topic-map.md` + `keywords.json` (indexes:rebuild).

User-gated: `SYNC_ADMIN_TOKEN` Cloudflare Secrets injection, authenticated runtime screenshot, staging deploy, commit, push, PR. Issue #1089 remains CLOSED (no Issue mutation).
