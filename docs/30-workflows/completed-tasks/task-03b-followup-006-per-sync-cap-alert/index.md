[実装区分: 実装仕様書]

# task-03b-followup-006-per-sync-cap-alert

## wave / mode / owner

| 項目 | 値 |
| --- | --- |
| wave | 03b follow-up / observability cluster |
| mode | sequential（schema 拡張 → 検知ロジック → analytics emit → tests → runbook） |
| owner | - |
| 状態 | implemented-local |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| issue | https://github.com/daishiman/UBM-Hyogo/issues/199 (OPEN, keep open) |
| task_id | TASK-03B-FOLLOWUP-006-PER-SYNC-CAP-ALERT |
| 引き取り元 | docs/30-workflows/completed-tasks/03b-parallel-forms-response-sync-and-current-response-resolver-followups/03b-followup-006-per-sync-cap-alert.md |

## purpose

`apps/api/src/jobs/sync-forms-responses.ts` の per-sync write cap (200) 到達を `sync_jobs.metrics_json.writeCapHit` として明示的に記録し、直近 N=3 件すべてが cap hit の場合に Cloudflare Analytics Engine へ `sync_write_cap_consecutive_hit` イベントを emit する。閾値 / 通知チャネル / escalation を specs と runbook に正本化することで、回答急増・retry storm に対する運用検知を確立する。

## why this is not a restored old task

03b-followup-006 として unassigned-task に検出済みの未実施タスクを Issue #199 として正式起票したもの。03b 本体（cap = 200 実装）の責務分割であり、cap 値そのもののチューニングや cron 間隔変更は含まない。Auth.js / D1 schema migration には触れない。

## scope in / out

### Scope In

- `apps/api/src/jobs/sync-forms-responses.ts` の `succeed()` 呼び出し時に `writeCapHit: boolean` を `metrics_json` に書き込む（前方互換: absent = false）
- `apps/api/src/jobs/_shared/sync-jobs-schema.ts` の zod schema 拡張（`writeCapHit` optional boolean、PII チェック影響なし）
- 連続 hit 検知 helper 新規: `apps/api/src/jobs/cap-alert.ts`（直近 N 行を `sync_jobs ORDER BY started_at DESC LIMIT 3` で取得し連続 cap hit 判定）
- Cloudflare Analytics Engine binding 追加: `apps/api/wrangler.toml` の `[[analytics_engine_datasets]]` ブロック（dataset = `sync_alerts`）
- カスタムイベント emit: 連続 N=3 hit 検知時に `env.SYNC_ALERTS.writeDataPoint({ blobs: ["sync_write_cap_consecutive_hit", jobKind], doubles: [consecutiveHits, windowSize], indexes: [jobId] })` を発火。重複抑制は「直前の成功 job が未達から達成へ遷移した時のみ emit」とする
- 単体テスト: `apps/api/src/jobs/cap-alert.test.ts` 新規 / `sync-forms-responses.test.ts` の `writeCapHit` 記録確認ケース追加
- 仕様書追記: `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` の observability / cost guardrail 節に閾値・チャネル・escalation 階段を明記
- runbook: `docs/30-workflows/task-03b-followup-006-per-sync-cap-alert/outputs/phase-12/runbook-per-sync-cap-alert.md` に連続 cap hit 検知時のオペレータ手順 + D1 無料枠影響評価（200 × 96 = 19,200 write/day < 100k/day）を記載

### Scope Out

- per-sync cap (200) 自体のチューニング（03b 本体の責務）
- cron 間隔変更（observability 側）
- Slack workspace 設定 / GitHub issue auto-creation API token 配備（05a-parallel-observability 側）
- Forms 回答急増時の sharding / 並列化
- `sync_jobs` テーブルの DDL 変更（`metrics_json` は既存 TEXT 列のため migration 不要）
- ユーザー明示指示なしの commit / push / PR 作成 / Cloudflare deploy

## dependencies

### Depends On

- 03b-parallel-forms-response-sync-and-current-response-resolver（per-sync cap = 200 実装が main にマージ済み）
- 既存 `sync_jobs` テーブル（`metrics_json TEXT` 列）
- 既存 `apps/api/src/jobs/_shared/sync-jobs-schema.ts` zod schema
- Cloudflare Analytics Engine free tier 25M write/month

### Blocks

- 05a-parallel-observability-and-cost-guardrails の cap alert 受け口
- 03b follow-up cluster の observability close-out

## refs

- docs/30-workflows/completed-tasks/03b-parallel-forms-response-sync-and-current-response-resolver-followups/03b-followup-006-per-sync-cap-alert.md
- https://github.com/daishiman/UBM-Hyogo/issues/199
- apps/api/src/jobs/sync-forms-responses.ts
- apps/api/src/jobs/_shared/sync-jobs-schema.ts
- apps/api/src/jobs/cursor-store.ts
- apps/api/wrangler.toml
- docs/00-getting-started-manual/specs/08-free-database.md
- .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md

## AC

- AC-1: `sync_jobs.metrics_json.writeCapHit` が cap 到達時 `true`、未到達時 `false` で記録される（既存行の absent は false 解釈）
- AC-2: 直近 3 行すべて `writeCapHit === true` かつ直前 window が未達から達成へ遷移したとき、`sync_write_cap_consecutive_hit` イベントが Analytics Engine dataset `sync_alerts` に 1 回だけ emit される
- AC-3: 閾値（N=3 で issue 起票候補 / N=6 でメール候補）と通知チャネル抽象化が specs に明記される
- AC-4: D1 無料枠影響評価が runbook に記載される（write/day 試算と余裕度）
- AC-5: 連続 cap hit 検知時のオペレータ手順が runbook 化される
- AC-6: unit test で `writeCapHit` 記録 / 連続検知ロジック / Analytics emit が網羅される
- AC-7: 既存 sync-forms-responses test (`apps/api/src/jobs/sync-forms-responses.test.ts`) が後方互換のまま PASS

## phase index

| Phase | ファイル | 概要 |
| --- | --- | --- |
| 1 | [phase-01.md](phase-01.md) | 要件定義 |
| 2 | [phase-02.md](phase-02.md) | スコープ確定 / アーキテクチャ整合 |
| 3 | [phase-03.md](phase-03.md) | 設計（schema / detector / emit / runbook） |
| 4 | [phase-04.md](phase-04.md) | 実装計画（変更ファイル × 差分方針） |
| 5 | [phase-05.md](phase-05.md) | 実装着手ランブック |
| 6 | [phase-06.md](phase-06.md) | 単体テスト計画 |
| 7 | [phase-07.md](phase-07.md) | 統合 / 契約検証 |
| 8 | [phase-08.md](phase-08.md) | NON_VISUAL governance / Phase 8 single-source YAML |
| 9 | [phase-09.md](phase-09.md) | デプロイ前検証（dry-run / staging） |
| 10 | [phase-10.md](phase-10.md) | リリース計画 |
| 11 | [phase-11.md](phase-11.md) | NON_VISUAL evidence 取得 |
| 12 | [phase-12.md](phase-12.md) | Phase 12 5 必須タスク + runbook close-out |
| 13 | [phase-13.md](phase-13.md) | commit / PR 承認ゲート |
