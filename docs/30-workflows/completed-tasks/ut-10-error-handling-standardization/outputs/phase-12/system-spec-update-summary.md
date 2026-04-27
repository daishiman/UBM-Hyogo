# システム仕様書更新サマリー（Phase 12 Task 12-2 成果物）

## 方針

UT-10 の Phase 12 final review で、`apps/api/docs/error-handling.md` だけでは正本仕様同期が不足していることを確認したため、same-wave sync として `.claude/skills/aiworkflow-requirements/` と `.claude/skills/task-specification-creator/` へ反映した。

## Step 1-A: 完了タスク記録

| 対象 | 反映内容 | 状態 |
| --- | --- | --- |
| `.claude/skills/aiworkflow-requirements/references/error-handling.md` | UT-10 APIエラー標準入口、`ApiError` / code taxonomy / retry / compensation / logging 方針 | 完了 |
| `.claude/skills/aiworkflow-requirements/references/interfaces-shared.md` | `@ubm-hyogo/shared` の `errors` / `retry` / `db/transaction` / `logging` 公開 API 契約 | 完了 |
| `.claude/skills/aiworkflow-requirements/references/interfaces-api.md` | `apps/api` error handler と `apps/web` API client の契約 | 完了 |
| `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` | `generate-index.js` による再生成 | 完了 |
| `.claude/skills/aiworkflow-requirements/LOGS.md` | UT-10 close-out sync 記録 | 完了 |
| `.claude/skills/task-specification-creator/LOGS.md` | UT-10 Phase 12 close-out sync 記録 | 完了 |
| `apps/api/docs/error-handling.md` | 開発者向けエラーハンドリングガイド | 完了 |

## Step 1-B: 実装状況テーブル更新

`artifacts.json` と `outputs/artifacts.json` は Phase 1〜12 を `completed`、Phase 13 を `pending_user_approval` として同期した。Phase 13（PR作成）はユーザー承認待ちのため未実行。

## Step 1-C: 関連タスクテーブル更新

| 関連タスク | 影響内容 | 反映先 |
| --- | --- | --- |
| UT-09（Sheets→D1 同期） | `withRetry` + `SHEETS_RETRY_PRESET` + `runWithCompensation` を利用前提で実装 | `unassigned-task-detection.md` に継続 |
| UT-07（通知基盤） | `runWithCompensation` の `recordDeadLetter` フックで Slack 通知 | `unassigned-task-detection.md` に継続 |
| UT-08（モニタリング） | `StructuredLogPayload` を Cloudflare Logpush / alerting に接続 | `unassigned-task-detection.md` に継続 |
| 02-serial-monorepo-runtime-foundation | `apps/api` の Hono runtime 上で `errorHandler` が組み込まれる | `apps/api/src/index.ts` で配線済み |

## Step 1-D: topic-map / index 再生成

```bash
node .claude/skills/aiworkflow-requirements/scripts/generate-index.js
```

実行済み。`interfaces-shared.md` / `interfaces-api.md` / `error-handling.md` が index 対象に含まれる。

## Step 1-E: documentation-changelog / evidence 同期

`outputs/phase-12/documentation-changelog.md` に同波同期後の変更ファイルを反映した。

## Step 1-F: 4 ファイル更新

| # | ファイル | 状態 |
| --- | --- | --- |
| 1 | `.claude/skills/aiworkflow-requirements/LOGS.md` | 完了 |
| 2 | `.claude/skills/task-specification-creator/LOGS.md` | 完了 |
| 3 | `.claude/skills/aiworkflow-requirements/SKILL.md` | 完了 |
| 4 | `.claude/skills/task-specification-creator/SKILL.md` | 完了 |

## Step 1-G: final validation

| 系統 | コマンド | 結果 |
| --- | --- | --- |
| requirements index | `node .claude/skills/aiworkflow-requirements/scripts/generate-index.js` | PASS |
| artifact parity | `diff docs/30-workflows/ut-10-error-handling-standardization/artifacts.json docs/30-workflows/ut-10-error-handling-standardization/outputs/artifacts.json` | PASS |
| typecheck | `pnpm --filter @ubm-hyogo/shared build` | 実行対象 |
| grep evidence | `rg -n "UT-10|ApiError|withRetry|runWithCompensation" .claude/skills/aiworkflow-requirements docs/30-workflows/ut-10-error-handling-standardization` | PASS |

## Step 2: 新規インターフェースの正本反映

以下を正本仕様へ反映済み。

1. `ApiError`, `ApiErrorClientView`, `UbmErrorCode`, `UBM_ERROR_CODES`（`@ubm-hyogo/shared/errors`）
2. `withRetry`, `RetryOptions`, `SHEETS_RETRY_PRESET`, `defaultClassify`（`@ubm-hyogo/shared/retry`）
3. `runWithCompensation`, `CompensationStep`, `CompensationFailureRecord`（`@ubm-hyogo/shared/db/transaction`）
4. `logError`, `logWarn`, `logInfo`, `logDebug`, `sanitize`, `StructuredLogPayload`（`@ubm-hyogo/shared/logging`）

## artifacts.json 同期

`artifacts.json` と `outputs/artifacts.json` は同期済み。

## まとめ

Phase 12 必須の正本仕様更新、LOGS/SKILL 更新、topic-map 再生成、artifact parity を同一 wave で完了した。残る大きな課題は、vitest 未導入によるランタイム契約テスト未実装と、既存 sync endpoint への problem+json 適用であり、これらは既存スコープ外として未タスクに明記する。
