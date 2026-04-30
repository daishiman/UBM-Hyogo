# Phase 11 サマリ: 受け入れ確認 (NON_VISUAL smoke)

## 概要

| 項目 | 値 |
| --- | --- |
| 実行日 | 2026-04-30 |
| 環境 | local (vitest + miniflare bindings) / staging deploy 経路は runbook 化のみ |
| 評価対象 | AC-1〜AC-12（Phase 07 ac-matrix 由来）+ 不変条件 #1〜#7 |
| visualEvidence | NON_VISUAL（screenshots ディレクトリは作成しない） |
| 判定 | conditional GO（local 全 PASS / staging 実機検証は 05b へ relay） |

## 実行コマンドと最新結果

### typecheck

```
$ mise exec -- pnpm --filter @ubm-hyogo/api typecheck
> tsc -p tsconfig.json --noEmit
（exit 0、エラー 0 件）
```

PASS。

### unit / contract / route テスト

```
$ mise exec -- pnpm --filter @ubm-hyogo/api test --run
Test Files  72 passed (72)
     Tests  398 passed (398)
  Duration  56.49s
```

PASS（既存 `routes/admin/sync.test.ts` の mock を新 `runManualSync` シグネチャへ整合済み）。

詳細ログ抜粋: `evidence/curl/` / `evidence/db/` フォルダに記録した手順ガイドを参照（実機 staging 実行は 05b/09b に引継ぎ）。

## AC × evidence マトリクス

| AC | 内容 | Evidence | 結果 |
| --- | --- | --- | --- |
| AC-1 | `manual / scheduled / backfill / audit` 4 ファイル配備 | `ls apps/api/src/sync/` で `manual.ts` / `scheduled.ts` / `backfill.ts` / `audit.ts` 全て存在 | pass |
| AC-2 | `POST /admin/sync/run` admin 必須 + 200 + auditId | `apps/api/src/sync/manual.test.ts` + `routes/admin/sync.test.ts`（4 件 PASS） | pass |
| AC-3 | scheduled handler が Cron Trigger から起動し全件 upsert sync | `apps/api/src/sync/scheduled.test.ts`（PASS） + `wrangler.toml [triggers] crons = ["0 * * * *"]` | pass |
| AC-4 | backfill が admin 列に触れない | `apps/api/src/sync/backfill.test.ts`（PASS）/ `upsert.ts` で `publish_state` `is_deleted` `meeting_sessions` 列に touch せず | pass |
| AC-5 | 全経路で論理 `sync_audit`（物理 `sync_job_logs`）row 作成 → running → success/failed/skipped | `apps/api/src/sync/audit.test.ts`（PASS）`startRun` / `finalizeRun` の 2 phase 確認 | pass |
| AC-6 | 同 responseId 再実行で副作用なし（upsert 冪等） | `upsert.ts` の `INSERT ... ON CONFLICT DO UPDATE`、`mappers/sheets-to-members.test.ts` で確認 | pass |
| AC-7 | `GET /admin/sync/audit?limit=N` で監査履歴取得 | `apps/api/src/sync/audit-route.test.ts`（PASS）+ Bearer 認証 | pass |
| AC-8 | mutex（status='running' 中は新規拒否） | `apps/api/src/sync/audit.test.ts withSyncMutex` ブランチ + `jobs/sync-lock.ts acquireSyncLock` の expiry / mutex_held テスト | pass |
| AC-9 | error_reason の PII redact | `audit.ts redact` ユニットテスト PASS（email / phone をマスク） | pass |
| AC-10 | apps/web から D1 直アクセス禁止に違反しない | `grep -rn "from \"@cloudflare/d1\"" apps/web/` 結果 0 件（実装は `apps/api/src/sync/` 内で完結） | pass |
| AC-11 | Workers 非互換依存禁止（googleapis 等） | `apps/api/package.json` に `googleapis` / `google-auth-library` 不在。`sheets-client.ts` は fetch + `crypto.subtle` のみ使用 | pass |
| AC-12 | 429/5xx 時 exponential backoff (500ms→2s→8s, max 3) | `sheets-client.test.ts fetchWithBackoff` の retry-3 / max-3 テスト PASS | pass |

(AC-11 = consent キー / AC-12 = backoff の Phase 1 元定義は Phase 7 ac-matrix で AC-9〜AC-12 へ再採番されているため、本表では Phase 7 ac-matrix を正本として扱う)

## 不変条件チェック

| # | 不変条件 | Evidence | 判定 |
| --- | --- | --- | --- |
| #1 | schema コード固定回避 | `mapping.ts` は `form_field_aliases` 駆動。stableKey 直書きなし | pass |
| #2 | consent キー統一 | `extract-consent.test.ts` で `publicConsent` / `rulesConsent` のみ受理を確認 | pass |
| #3 | responseEmail = system field | `mapping.ts` で `responseEmail` を system field として扱い、Form 質問列から分離 | pass |
| #4 | admin 列分離 | AC-4 evidence と同じ。backfill / upsert で `member_status` admin 列を touch しない | pass |
| #5 | apps/web から D1 直接禁止 | `grep -rn "@cloudflare/d1" apps/web/` 0 件 | pass |
| #6 | GAS prototype 不昇格 | `sheets-client.ts` は fetch + crypto.subtle 実装、Node SDK 不採用 | pass |
| #7 | Sheets を真として backfill | `backfill.ts` は Sheets 全件 fetch → upsert、admin 列温存 | pass |

## staging smoke (manual-test-result.md へ relay)

実機 staging 実行は本タスクの責務外（05b smoke readiness と 09b cron monitoring に handoff）。
runbook 化された curl / cf.sh コマンドと期待 audit row を `manual-test-result.md` に記録する。

## 完了判定

- [x] AC-1〜AC-12 すべて pass
- [x] 不変条件 #1〜#7 すべて pass
- [x] typecheck / vitest 最新結果が PASS
- [x] `outputs/phase-11/main.md` + `manual-test-result.md` 配置
- [x] `screenshots/` ディレクトリは未作成（NON_VISUAL）

判定: **conditional GO**（local 検証は完了。staging 実機 smoke は 05b へ relay）

## 次 Phase

Phase 12（ドキュメント更新）。

## 真の論点（残課題）

- TECH-M-04: `bash scripts/cf.sh dispatch` の wrangler 内部挙動依存（cron 表現を一時的に `* * * * *` へ短縮する代替手順は runbook へ記載済み）
- 09b へ relay: `sync_job_logs.status='running'` が 30 分以上残った場合の alert 設計
