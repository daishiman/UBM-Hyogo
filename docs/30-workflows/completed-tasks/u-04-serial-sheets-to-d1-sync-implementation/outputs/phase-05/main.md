# Phase 5 成果物: 実装ランブック（u-04 sheets-to-d1-sync-implementation）

> 状態: completed
> 入力: phase-04/test-matrix.md, phase-02/{sync-module-design,audit-writer-design,cron-config,d1-contract-trace}.md
> 出力: outputs/phase-05/main.md, outputs/phase-05/runbook.md

## 1. ファイル配置（実装スコープ）

新規:
- `apps/api/src/sync/types.ts`
- `apps/api/src/sync/audit.ts`
- `apps/api/src/sync/mutex.ts`
- `apps/api/src/sync/mapping.ts`（Phase 9 で物理移動。本 Phase は `jobs/mappers/sheets-to-members.ts` を re-export）
- `apps/api/src/sync/upsert.ts`
- `apps/api/src/sync/sheets-client.ts`（既存 `jobs/sheets-fetcher.ts` を内部再利用）
- `apps/api/src/sync/manual.ts`
- `apps/api/src/sync/scheduled.ts`
- `apps/api/src/sync/backfill.ts`
- `apps/api/src/sync/index.ts`
- `apps/api/src/middleware/require-sync-admin.ts`（既存 `routes/admin/sync.ts` 内 Bearer ロジックを middleware 化）
- 各テスト `*.test.ts`

更新:
- `apps/api/src/index.ts`（scheduled handler に `runScheduledSync` 接続、`syncRouter` mount）
- `apps/api/src/routes/admin/sync.ts`（`POST /admin/sync/run` 正本 + 互換 `POST /admin/sync` mount）
- `apps/api/wrangler.toml`（production triggers `0 */6 * * *` → `0 * * * *`）
- `apps/api/src/jobs/sync-sheets-to-d1.ts`（Phase 9 で deprecation re-export 化）

## 2. TDD 手順

| order | 対象 | 検証 |
| --- | --- | --- |
| 1 | audit.ts | U-A-01..08 |
| 2 | mapping.ts (re-export + alias support) | U-M-01..12 + C-D-01..31 |
| 3 | upsert.ts | U-U-01..06 |
| 4 | mutex.ts | U-X-01..04 |
| 5 | sheets-client.ts | U-S-01..05 |
| 6 | manual.ts | I-01, I-02 |
| 7 | scheduled.ts | I-03, I-07 |
| 8 | backfill.ts | I-04 |
| 9 | index.ts mount + wrangler triggers | E2E sanity |

## 3. 設計対応

- audit writer 物理 = `sync_job_logs`、論理名 `sync_audit`。`trigger` 値正規化 (manual / scheduled / backfill)。`status` superset (running / success / failed / skipped)。
- mutex 物理 = `sync_locks` (lock id `sheets-to-d1`、TTL 10 分、stale 削除 → INSERT)。
- backfill = D1 batch + truncate-and-reload。`member_status` は `public_consent` / `rules_consent` 列のみ更新。
- manual / scheduled = 差分なしの場合も audit row finalize。
- backoff = 500ms → 2s → 8s（最大 3 retry）。

## 4. sanity check（Phase 11 で実行）

| # | 手順 |
| --- | --- |
| S-01 | `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` |
| S-02 | `mise exec -- pnpm --filter @ubm-hyogo/api test -- sync` |
| S-03 | `grep -r "googleapis\|^node:" apps/api/src/sync` 0 件 |
| S-04 | `grep -r "publish_state\|is_deleted\|meeting_sessions" apps/api/src/sync/{manual,scheduled,backfill}.ts` 0 件 |
| S-05 | curl manual + 連続 2 回目 409 |
| S-06 | scheduled 起動で audit row INSERT |

## 5. 完了条件

- [x] 9 ファイル配置と単体テスト ID
- [x] withSyncMutex の try/finally 経路で必ず finalize
- [x] wrangler triggers 1 行差分
- [x] secret 値含まず
