## Summary

- `packages/shared/src/zod/sync-log.ts` を新設し、`SyncLogStatusZ` / `SyncTriggerTypeZ` / `SyncLogRecordZ` を Zod schema + `z.infer` 型として一意定義
- `apps/api/src/sync/types.ts` の `SyncTrigger` / `AuditStatus` を shared 由来 re-export に置換し、`apps/api/src/sync/audit.ts` の `lockTriggerOf` 変換関数を削除
- canonical 値は物理 DDL（`apps/api/migrations/0002_sync_logs_locks.sql`）に揃え、TS = shared = DB の 3 者一致を実現

## Canonical 値（物理 DDL 一致）

- `SyncLogStatus`: `running` / `success` / `failed` / `skipped`
- `SyncTriggerType`: `cron` / `admin` / `backfill`

## 旧 TS 値からの mapping

| 旧 TS | 新 canonical |
|------|------------|
| `manual` | `admin` |
| `scheduled` | `cron` |
| `backfill` | `backfill` |

## 主な変更ファイル

- 新規: `packages/shared/src/zod/sync-log.ts`, `packages/shared/src/zod/sync-log.spec.ts`
- 改修: `packages/shared/src/zod/index.ts`（1 行追加）
- 改修: `apps/api/src/sync/{types,audit,manual,scheduled}.ts`
- 改修: `apps/api/src/jobs/sync-sheets-to-d1.ts`（`SyncOptions.trigger` を shared 由来へ）
- 改修: `apps/api/src/sync/{audit,manual,scheduled}.contract.spec.ts`（期待値 canonical 化）

## Test plan

- [ ] `mise exec -- pnpm typecheck` green
- [ ] `mise exec -- pnpm lint` green
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/shared test` で `sync-log.spec.ts` 20+ 件 green
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/api test -- sync/` 既存 contract spec + 拡張 1 it green
- [ ] grep gate 全 4 種 0 件（`docs/30-workflows/issue-266-shared-sync-zod-contract/outputs/phase-11/grep-gate.sh`）
- [ ] staging D1 `SELECT DISTINCT trigger_type FROM sync_job_logs` が `cron|admin|backfill` の 3 値以内（`outputs/phase-11/d1-distinct.log`）

## Out of scope（明示）

- `sync_jobs`（issue #195）テーブル契約 → 別 task
- 物理テーブル名 `sync_job_logs` → `sync_log` rename（U-7）→ 別 task
- `apps/web` admin/audit 画面の `safeParse` 適用 → 別 task
- ESLint custom rule 追加 → 別 task（後続 lint 強化）
- staging D1 旧 trigger 値 cleanup（Phase 11 で残存検出時のみ起票）

## Refs / Closes

- Refs #266
- Refs U-UT01-08（物理 canonical 採用により実質吸収）
- Refs U-UT01-10（本 PR で formalize）

## Workflow 仕様書

`docs/30-workflows/issue-266-shared-sync-zod-contract/`（phase-1 〜 phase-13 + outputs）
