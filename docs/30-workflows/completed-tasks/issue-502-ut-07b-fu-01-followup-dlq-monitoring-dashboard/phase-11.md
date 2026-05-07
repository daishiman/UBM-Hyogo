# Phase 11: 手動検証（NON_VISUAL 縮約 / contract-ready runtime pending）

> [実装区分: ドキュメントのみ]（CONST_004 例外条件適用）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | UT-07B-FU-01-FOLLOWUP schema alias back-fill DLQ 監視ダッシュボード整備 |
| Phase 番号 | 11 / 13 |
| 前 Phase | 10（最終レビューゲート） |
| 次 Phase | 12（ドキュメント更新） |
| 状態 | contract_ready_runtime_pending（実 D1 SQL / dash runtime は user approval 後） |
| 実装区分 | ドキュメントのみ |
| visualEvidence | NON_VISUAL |
| taskType | docs-only |
| user_approval_required | true（実 D1 SQL / dash runtime 確認のみ。local grep / SQL template evidence は取得済み） |
| GitHub Issue | #502（CLOSED 据え置き） |
| 変更対象ファイル / 関数シグネチャ / unit/integration/e2e tests | **N/A（コード変更なし）** |

## VISUAL / NON_VISUAL 判定

- mode: **NON_VISUAL**（UI 追加なし / 一次証跡は CLI ログ + JSON + markdown 集計に閉じる）
- screenshot は不要（`outputs/phase-11/screenshots/` ディレクトリは作成しない / false green 防止）
- Cloudflare dash 画面は「Queue / DLQ メトリクス画面の存在確認」のみで本文記録、画像保存は行わない
- 適用テンプレ: `.claude/skills/task-specification-creator/references/phase-template-phase11.md` §「NON_VISUAL 縮約テンプレ」

## 目的

runbook 候補の集計 SQL 3 種と Cloudflare dash 観測手順を NON_VISUAL evidence として固定する。local cycle では `apps/api/wrangler.toml` / repository / migration の grep、SQL template、redaction / read-only grep を取得済みとし、staging 環境（`ubm-hyogo-db-staging`）への `bash scripts/cf.sh d1 execute` と Cloudflare dash runtime 到達確認は **user approval 後**に実施する。Phase 11 の現ステータスは runtime PASS ではなく `contract_ready_runtime_pending`。

## 実行タスク

1. staging Queue / DLQ binding 存在確認（`bash scripts/cf.sh` whoami → wrangler.toml 値の照合）
2. 集計 SQL 3 種の template と実行手順を記録 → `outputs/phase-11/aggregation.md`
3. Cloudflare dash 到達手順を記録 → `outputs/phase-11/dash-observation.md`
4. staging 実行後に、集計 SQL 3 種の実測結果を `aggregation.md` に追記（user approval 後）
5. しきい値整合確認（DLQ >= 1 / retry >= 3 / exhausted 24h の判定が SQL 結果から導けること）を runtime 実行時に追記
6. redaction grep（`failed_items_json` 内に PII 系 token が露出していないか） → `outputs/phase-11/redaction-grep.log`
7. read-only 検証（SQL 文字列に `INSERT` / `UPDATE` / `DELETE` / `DROP` / `ALTER` が含まれないこと） → `outputs/phase-11/read-only-grep.log`

## 苦戦箇所【記入必須】

| # | 苦戦箇所 | 緩和策 |
| --- | --- | --- |
| 1 | staging fixture が空の場合、SQL 結果が 0 件で「動作したか」の判定が曖昧 | 0 件 = 正常（`COUNT(*) = 0`）と扱い、判定は SQL 文の構文成功 + `bash scripts/cf.sh` exit code 0 で確定する |
| 2 | `failed_items_json` に schema diff 内容（PII 含む可能性）が混入する | 出力保存前に `email` / `responseEmail` / `token` / `bearer` / `secret` / `Authorization` を redaction grep し、検出時は `[REDACTED]` 化 |
| 3 | Cloudflare dash の Queue 画面 URL がアカウント / namespace 単位で異なる | URL を直接記録せず、画面到達経路（dash → Workers & Pages → Queues → 該当 queue 名）の手順を runbook 化 |
| 4 | `bash scripts/cf.sh d1 execute` のシングルクォート / ダブルクォートエスケープ | SQL を 1 行化し `--command "..."` でラップ、複雑な SQL は `--file` に切り替える |

## 4 条件評価

| 条件 | 評価 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS_BOUNDARY | SQL / dash 手順の契約は固定済み。staging 実測での数値返却確認は user approval 後 |
| 実現性 | PASS | `bash scripts/cf.sh d1 execute` は read-only / `op run` 経由で wrangler 直接禁止ポリシーに整合 |
| 整合性 | PASS | AC-1 / AC-2 / AC-7 / AC-8 と直接対応、AC-9（構造変更なし）にも整合（read-only 実行のみ） |
| 運用性 | PASS | 0 件結果でも判定可能、redaction grep で PII 流出防止、read-only grep で改変系 SQL 混入を機械的に排除 |

## evidence 一覧 / AC 紐付け

| AC | path | 内容 | 取得コマンド |
| --- | --- | --- | --- |
| AC-1 | `outputs/phase-11/dash-observation.md` | Queue / DLQ 画面到達経路。実画面確認は user approval 後 | dash 手動確認の手順記録 |
| AC-2 | `outputs/phase-11/aggregation.md` | DLQ 相当 / retry 過剰 / exhausted 滞留 の 3 SQL template。staging 実測値は user approval 後に追記 | `bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging --command "..."` |
| AC-7 | `outputs/phase-11/read-only-grep.log` | 集計 SQL 文字列に改変系 keyword 不在 | `rg -nE "INSERT|UPDATE|DELETE|DROP|ALTER" docs/runbooks/dlq-monitoring/schema-alias-backfill.md`（draft 段階では runbook draft 文字列に対して実行） |
| AC-8 | `outputs/phase-11/aggregation.md` | binding / 列 / migration ID の逆引き可能性 | SQL template 内に `schema_diff_queue` 列名が登場することを確認 |
| AC-3 | `outputs/phase-11/aggregation.md` | DLQ >= 1 / retry >= 3 / exhausted 24h の判定行（runtime 実測値は user approval 後） | SQL template に対する markdown 表まとめ |
| AC-9 | `gh issue view 502 --json state` | `"state": "CLOSED"` | `gh issue view 502 --json state` |

> AC-4 / AC-5 / AC-6 / AC-10 / AC-11 は Phase 10 / Phase 12 で扱う。

## runtime evidence 状態語彙

| 語彙 | 適用条件 |
| --- | --- |
| **PASS** | Gate PASS 後、本 Phase の全 evidence（AC-1〜AC-3, AC-7〜AC-9）が揃い、redaction grep / read-only grep が 0 件もしくは `[REDACTED]` 化済 |
| **NO-GO** | SQL 構文 FAIL / Cloudflare dash 画面不在 / redaction で PII 漏洩検出 → 該当 phase 差し戻し |

## 実行手順（要約）

```bash
# Step 0: 出力先準備
mkdir -p docs/30-workflows/issue-502-ut-07b-fu-01-followup-dlq-monitoring-dashboard/outputs/phase-11

# Step 1: 認証 / binding 存在確認
bash scripts/cf.sh whoami

# Step 2: 集計 SQL 3 種を staging で read-only 実行
# (a) DLQ 投入相当（failed_items_json IS NOT NULL）
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging \
  --command "SELECT COUNT(*) AS dlq_equivalent FROM schema_diff_queue WHERE failed_items_json IS NOT NULL"

# (b) retry 過剰（retry_count >= 3）
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging \
  --command "SELECT COUNT(*) AS retry_exceeded FROM schema_diff_queue WHERE retry_count >= 3"

# (c) exhausted 滞留 24h 超
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging \
  --command "SELECT COUNT(*) AS exhausted_stale FROM schema_diff_queue WHERE backfill_status = 'exhausted' AND last_processed_at <= datetime('now','-24 hours')"

# 上記 3 結果は user approval 後に aggregation.md へ追記する。

# Step 3: Cloudflare dash 画面存在確認（手動）
# - dash → Workers & Pages → Queues → schema-alias-backfill-staging が存在
# - dash → Workers & Pages → Queues → schema-alias-backfill-staging-dlq が存在
# 結果を outputs/phase-11/dash-observation.md に手順 + 確認時刻で記録

# Step 4: しきい値整合確認
# outputs/phase-11/aggregation.md に
# | しきい値 | SQL 結果 | 判定 | のテーブルでまとめる

# Step 5: redaction grep（出力 JSON 内の PII 系 token 検出）
rg -nE "token|bearer|secret|Authorization|email|responseEmail" \
  docs/30-workflows/issue-502-ut-07b-fu-01-followup-dlq-monitoring-dashboard/outputs/phase-11/aggregation.md \
  > docs/30-workflows/issue-502-ut-07b-fu-01-followup-dlq-monitoring-dashboard/outputs/phase-11/redaction-grep.log \
  || echo "OK: no PII tokens" >> docs/30-workflows/issue-502-ut-07b-fu-01-followup-dlq-monitoring-dashboard/outputs/phase-11/redaction-grep.log

# Step 6: read-only 検証（runbook draft 文字列に改変系 keyword 不在）
rg -nE "INSERT |UPDATE |DELETE |DROP |ALTER " \
  docs/30-workflows/issue-502-ut-07b-fu-01-followup-dlq-monitoring-dashboard/outputs/phase-11/aggregation.md \
  > docs/30-workflows/issue-502-ut-07b-fu-01-followup-dlq-monitoring-dashboard/outputs/phase-11/read-only-grep.log \
  || echo "OK: read-only" >> docs/30-workflows/issue-502-ut-07b-fu-01-followup-dlq-monitoring-dashboard/outputs/phase-11/read-only-grep.log
```

## 完了条件チェックリスト

- [x] `outputs/phase-11/aggregation.md` に 3 SQL template と runtime 転記欄が記録
- [x] `outputs/phase-11/dash-observation.md` に Queue / DLQ 画面到達経路が記録
- [ ] user approval 後、staging 実測値と確認時刻を `aggregation.md` / `dash-observation.md` に追記
- [ ] `outputs/phase-11/redaction-grep.log` 0 件もしくは `[REDACTED]` 化済
- [ ] `outputs/phase-11/read-only-grep.log` で改変系 keyword 検出 0 件
- [ ] `gh issue view 502 --json state` が CLOSED
- [ ] `outputs/phase-11/screenshots/` を作成していない（NON_VISUAL 整合）
- [ ] `bash scripts/cf.sh` 経由のみで wrangler 直接実行していない

## 不変条件への影響

| # 1〜7 | 影響なし（コード変更なし / read-only `bash scripts/cf.sh d1 execute` のみ / 不変条件 #5 は staging 環境で運用者手動の read-only 実行のため遵守） |
| --- | --- |

## 次 Phase への引き渡し

- 次 Phase: 12（ドキュメント更新）
- 引き継ぎ: `aggregation.md` の SQL template と `dash-observation.md` の到達経路を Phase 12 に転記済み。実 D1 SQL / dash runtime evidence は user approval 後に追記する。
- ブロック条件: SQL 構文 FAIL / Cloudflare dash 画面不在 / redaction grep で PII 漏洩検出 / `screenshots/` 誤作成 / Issue #502 の誤 reopen / wrangler 直接実行混入。

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| aggregate | `outputs/phase-11/aggregation.md` | 集計 SQL 3 種の template / runtime 転記欄 |
| dash | `outputs/phase-11/dash-observation.md` | Queue / DLQ 画面到達手順 / runtime 転記欄 |
| redact | `outputs/phase-11/redaction-grep.log` | PII 系 token 検出ログ |
| read-only | `outputs/phase-11/read-only-grep.log` | 改変系 keyword 検出ログ |

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `docs/30-workflows/issue-502-ut-07b-fu-01-followup-dlq-monitoring-dashboard/index.md` | AC / scope 正本 |
| 必須 | `apps/api/wrangler.toml` | Queue / DLQ binding 名の正本 |
| 必須 | `apps/api/migrations/0014_schema_diff_queue_dedupe_failure.sql` | D1 schema の正本 |
| 必須 | `apps/api/src/repository/schemaDiffQueue.ts` | 列更新点の正本 |
| 必須 | `scripts/cf.sh` | Cloudflare CLI ラッパー（wrangler 直接禁止） |

## 統合テスト連携

本タスクは docs-only / NON_VISUAL のため、unit / integration / e2e test の追加は N/A。代替として staging 集計 SQL の `jq empty` PASS、redaction grep / read-only grep、Phase 12 strict 7 files、aiworkflow references 同期、`pnpm indexes:rebuild` drift 0 を検証ゲートとする。
