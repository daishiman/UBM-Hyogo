# Phase 01 — 要件定義

## 1.1 目的

`/admin/diagnostics/forms-pipeline` の `forms-pipeline-snapshot.json` で `hypothesisFlags.H1_ingestNeverRanOrAllErrors === true` が立った場合、または事前段階で `secretsReadiness` のいずれかが `false` の場合に、**production Google Form → D1 ingest パイプラインを稼働状態に復旧する**。

## 1.2 背景

- 親 workflow (PR #960 merged) で diagnostics endpoint・cron handler・sync-lock TTL・sheets-auth-classifier は実装済み。
- production Cloudflare Secrets (`GOOGLE_SERVICE_ACCOUNT_EMAIL` / `GOOGLE_PRIVATE_KEY` / `GOOGLE_FORM_ID`) と cron 起動は **コードからは検証不能な runtime 状態**であり、staging snapshot で H1 が立ち続けている可能性が残る。
- Issue #956 は CLOSED だが、closing は親 PR との refs 連動によるものであり、production runtime ops は未実施。

## 1.3 H1 仮説 (親 workflow Phase 01 から継承)

| 仮説 | 観測条件 |
|------|----------|
| H1: ingest never ran or all errors | `counts.formResponses === 0` または `latestSyncRuns.length === 0` または `(!hasSuccessfulRun && allCompletedRunsFailed)` |

検出ロジックは `apps/api/src/diagnostics/forms-pipeline.ts:85-113` の `deriveFormsPipelineHypotheses` が SSOT。

## 1.4 成功基準 (AC)

- AC-1: `bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env production` の出力に `GOOGLE_SERVICE_ACCOUNT_EMAIL` / `GOOGLE_PRIVATE_KEY` / `GOOGLE_FORM_ID` の 3 キーが含まれる
- AC-2: `forms-pipeline-snapshot.json` の `secretsReadiness.{googleServiceAccountEmail, googlePrivateKey, googleFormId}` が全 true
- AC-3: `forms-pipeline-snapshot.json` の `hypothesisFlags.H1_ingestNeverRanOrAllErrors === false`
- AC-4: `latestSyncRuns` に `status: "success"` の run が直近 1 件以上
- AC-5: `sync_jobs` テーブルに `started_at` が 1 時間以上前の `running` 状態 row が残存していない
- AC-6: `cf.sh tail` で `*/15 * * * *` cron が 1 cycle 以上発火したログを観測

## 1.5 スコープ

### 含む
- production Cloudflare Secrets 投入 (3 key)
- `apps/api/wrangler.toml` の cron schedule 現状確認 (drift 無確認)
- `cf.sh tail` での cron 起動観測
- `sync_jobs` table の stale `running` row の手動 reset (該当時のみ)
- diagnostics snapshot の事前/事後取得・差分検証

### 含まない (別タスク)
- H2/H3/H4 修復 (followup-002/003/004 で個別管理)
- diagnostics endpoint 改修 (親 workflow Spec-A 範囲、PR #960 で完了)
- D1 schema 変更
- Google Form schema 変更
- コード変更 (本タスクは runtime ops のみ)

## 1.6 非機能要件

- secret 値を docs / code / commit message / log / chat history のいずれにも転記しない
- `wrangler` 直叩き 0 件 (全 Cloudflare 操作は `scripts/cf.sh` 経由)
- production cron 一時停止は不要 (sync-lock TTL で自動回収されるため)
