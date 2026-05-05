# Phase 9 サマリ: リファクタリング

## 目的

Phase 3 で MINOR 追跡された TECH-M-01〜04 と Phase 8 で挙がった MINOR を集約し、`apps/api/src/sync/*` を「契約と差分ゼロ」「DRY」「単一責務」「unused 0」に収束させる。挙動を変えないリファクタのみ実施。

## 1. TECH-M 解消方針

| ID | 解消方針 | コード反映先 | 完了確認 |
| --- | --- | --- | --- |
| TECH-M-01 (mutex race) | `sync_locks` の UNIQUE PK 違反による単文排他取得 (`acquireSyncLock`) を `withSyncMutex` 内で唯一の起点に。stale lock は INSERT 前に DELETE。 | `apps/api/src/sync/audit.ts:withSyncMutex` + `apps/api/src/jobs/sync-lock.ts:acquireSyncLock` | U-X-03 PASS / I-07 PASS |
| TECH-M-02 (同秒取りこぼし) | `sheets-client.fetchDelta` で `submittedAt >= cursor` (>= 比較) を採用、responseId upsert で重複吸収 | `apps/api/src/sync/sheets-client.ts:fetchDelta` | I-04, I-05, I-06 PASS |
| TECH-M-03 (running 漏れ) | 全 handler を `withSyncMutex` 経由で `try/catch/finally` 統一。例外時は `finishRun(failed)` を必ず呼び lock も release。 | `apps/api/src/sync/audit.ts:withSyncMutex` | U-X-02 PASS |
| TECH-M-04 (shared 化) | YAGNI 維持。本タスクで sync 内に閉じ、Phase 12 unassigned-task に「admin endpoint で audit 参照需要が出た時点で再検討」記録 | コード変更なし | Phase 12 引き継ぎ |

## 2. 命名統一 (Before / After)

| 種別 | Before (混在) | After (集約) | 配置 |
| --- | --- | --- | --- |
| trigger 種別 | 文字列直書き | `SyncTrigger` type | `apps/api/src/sync/types.ts` |
| audit row 型 | any / 個別 interface | `AuditRow` | `apps/api/src/sync/audit.ts` |
| diff サマリ | summary/diff/counts | `DiffSummary` (`fetched/upserted/failed/retryCount/durationMs`) | `apps/api/src/sync/types.ts` |
| handler 命名 | runSync / executeSync | `runManualSync` / `runScheduledSync` / `runBackfill` | 各 handler ファイル |
| audit 状態 | in_progress / pending | `running / success / failed / skipped` | `AuditStatus` |

## 3. 共通化 (Before / After)

| 種別 | After | 配置 |
| --- | --- | --- |
| try/finally finalize | `withSyncMutex(deps, trigger, body)` 高階関数に集約 | `audit.ts` |
| Sheets fetch + map | `runFetchMapUpsert(env, deps, cursorIso?)` で manual/scheduled 共通化 | `manual.ts` (scheduled も呼出) |
| upsert SQL | `buildUpsertStatements(db, rows)` (manual + backfill 共有) | `upsert.ts` |
| backoff loop | `fetchWithBackoff(fn, config?, sleep?)` | `sheets-client.ts` |
| JWT 署名 | 既存 `GoogleSheetsFetcher` の crypto.subtle 経路を `createSheetsClient` で wrap | `sheets-client.ts` |
| Bearer 認証 | `requireSyncAdmin` middleware に集約 | `apps/api/src/middleware/require-sync-admin.ts` |

## 4. 未使用 / dead branch

| 種別 | 結果 |
| --- | --- |
| unused import | typecheck PASS で副次確認 (lint 別途実施) |
| unused export | `apps/api/src/sync/index.ts` を唯一の公開窓口とし、内部 helper は export せず |
| TODO/FIXME | sync 配下に残存なし |
| commented-out code | なし |

## 5. 物理整理

- `apps/api/src/sync/mapping.ts` は `jobs/mappers/sheets-to-members.ts` を re-export する形で維持 (Phase 9 時点での deprecation re-export)。既存 jobs 配下も呼出元との互換のため移動せず、将来 admin 系 sync 整理時に物理統合する。
- `apps/api/src/sync/mutex.ts` は `jobs/sync-lock.ts` を re-export。物理統合は U-05 / 整理タスクで判断。
- `apps/api/src/sync/sheets-client.ts` は `jobs/sheets-fetcher.ts` の `GoogleSheetsFetcher` を wrap した factory として維持。

## 6. リファクタ後 verify

| 種別 | コマンド | 結果 |
| --- | --- | --- |
| typecheck | `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` | PASS |
| sync test | `mise exec -- pnpm exec vitest run apps/api/src/sync` | 43/43 PASS |
| 挙動差分 | test 結果が証拠 | なし |

## 7. 残課題引き継ぎ

| ID | 内容 | 引き継ぎ先 |
| --- | --- | --- |
| Q-M-01 | mapping.ts 物理統合 | 後続 sync 整理タスク (Phase 12 unassigned 候補) |
| Q-M-03 | CPU time 実測 | Phase 11 sanity |
| TECH-M-04 | shared 化判断 | Phase 12 unassigned-task |
| 観測強化 | Cron 監視 / failed_reason メトリクス | 09b owner |

## 結論

- TECH-M-01 / TECH-M-02 / TECH-M-03 解消済み (test green が証拠)
- 命名統一 / 共通化 / unused 除去完了
- typecheck / test 全 PASS、coverage は Phase 8 と同等以上を維持
- 挙動差分なし
