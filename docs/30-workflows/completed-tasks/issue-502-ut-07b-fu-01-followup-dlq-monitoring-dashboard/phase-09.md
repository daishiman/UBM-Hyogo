# Phase 9: 品質保証

[実装区分: ドキュメントのみ]

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | schema alias back-fill Queue / DLQ 監視ダッシュボード整備 |
| GitHub Issue | #502（CLOSED 維持 / `Refs #502`） |
| Phase 番号 | 9 / 13 |
| Phase 名称 | 品質保証 |
| 作成日 | 2026-05-07 |
| 前 Phase | 8（DRY 化 / 仕様間整合） |
| 次 Phase | 10（最終レビューゲート） |
| 状態 | spec_created |
| taskType | docs-only（CONST_004 例外適用） |
| visualEvidence | NON_VISUAL |
| 実装区分 | **ドキュメントのみ** |

---

## 目的

docs-only / NON_VISUAL タスクとしての品質保証を行う。本タスクの成果物は `bash scripts/cf.sh d1 execute` の read-only 集計結果を新規 runbook（`docs/runbooks/dlq-monitoring/schema-alias-backfill.md`）と `.claude/skills/aiworkflow-requirements/references/` の DLQ 監視 topic に追記し、`changelog/20260507-issue502-dlq-monitoring.md` に 1 行追加することに完結する。コード変更を伴わないため、QA 観点は (1) read-only SQL 確認、(2) redaction grep（token / secret / authorization）、(3) SQL 構文 check、(4) `pnpm indexes:rebuild` drift check、(5) CODEOWNERS 整合 の 5 項目に絞り、Phase 10 への引き渡し条件と Phase 11 着手前のセルフレビュー項目を確定する。

---

## 品質基準

| # | 基準 | 確認内容 | PASS 条件 |
| --- | --- | --- | --- |
| 1 | read-only SQL 確認 | runbook §4 / `outputs/phase-11/sql-*.log` / references / aggregation.md に **句頭 SQL 動詞** として `UPDATE` / `DELETE` / `INSERT` / `DROP` / `ALTER` / `TRUNCATE` / `REPLACE` が出現しない | 禁止句 hits 0 |
| 2 | redaction grep | `outputs/phase-11/sql-*.log` / `cf-whoami.log` / `dash-observation.md` を対象に `token` / `bearer` / `secret` / `authorization` を case-insensitive で grep し、マッチ原文が runbook / references / changelog に転記されていない | 機微情報の skill references / runbook 転記 hits 0 |
| 3 | SQL 構文 check | runbook §4 の SQL #1 / #2 / #3 を `bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging --command "EXPLAIN QUERY PLAN <SQL>;"` で wrap し、構文エラーなく query plan が返ること（実データ無くても構文 validate） | EXPLAIN exit 0 / plan 取得 |
| 4 | indexes / 正本導線 check | references の DLQ 監視 topic 追加後に topic-map / keywords / quick-reference / resource-map / task-workflow-active / SKILL / LOGS から逆引きできることを確認 | 正本導線あり |
| 5 | CODEOWNERS 整合 | 本タスクで触る path（`docs/30-workflows/**` / `.claude/skills/**/references/**` / `docs/runbooks/**`）が `.github/CODEOWNERS` の最終マッチ owner と整合し、`gh api repos/daishiman/UBM-Hyogo/codeowners/errors` で `{"errors":[]}` を返す | CODEOWNERS errors 空 |

### 品質基準確認コマンド例

```bash
# (1) read-only SQL 確認（句頭の SQL 動詞のみマッチ）
rg -n -i "^\s*(update|delete|insert|drop|alter|truncate|replace)\b" \
  docs/runbooks/dlq-monitoring/schema-alias-backfill.md \
  docs/30-workflows/issue-502-ut-07b-fu-01-followup-dlq-monitoring-dashboard/outputs/phase-11/sql-*.log \
  .claude/skills/aiworkflow-requirements/references/dlq-monitoring.md \
  > docs/30-workflows/issue-502-ut-07b-fu-01-followup-dlq-monitoring-dashboard/outputs/phase-11/sql-readonly-grep.log || true
wc -l docs/30-workflows/issue-502-ut-07b-fu-01-followup-dlq-monitoring-dashboard/outputs/phase-11/sql-readonly-grep.log
# 期待: 0 行

# (2) redaction（skill references / runbook への転記後）
rg -i "token|bearer|secret|authorization" \
  docs/runbooks/dlq-monitoring/schema-alias-backfill.md \
  .claude/skills/aiworkflow-requirements/references/dlq-monitoring.md \
  .claude/skills/aiworkflow-requirements/changelog/20260507-issue502-dlq-monitoring.md \
  > docs/30-workflows/issue-502-ut-07b-fu-01-followup-dlq-monitoring-dashboard/outputs/phase-11/redaction-runbook-grep.log || true

# (3) SQL 構文 check（EXPLAIN QUERY PLAN）
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging --command "
EXPLAIN QUERY PLAN
SELECT COUNT(*) FROM schema_diff_queue WHERE failed_items_json IS NOT NULL;
" \
  > docs/30-workflows/issue-502-ut-07b-fu-01-followup-dlq-monitoring-dashboard/outputs/phase-11/sql-explain.log

# (4) indexes drift
mise exec -- pnpm indexes:rebuild
git status .claude/skills/aiworkflow-requirements/indexes/

# (5) CODEOWNERS 整合
gh api repos/daishiman/UBM-Hyogo/codeowners/errors \
  > docs/30-workflows/issue-502-ut-07b-fu-01-followup-dlq-monitoring-dashboard/outputs/phase-11/codeowners-errors.json
jq '.errors | length' docs/30-workflows/issue-502-ut-07b-fu-01-followup-dlq-monitoring-dashboard/outputs/phase-11/codeowners-errors.json
# 期待: 0
```

---

## 品質ゲート（Phase 10 への引き渡し条件）

Phase 10（最終レビューゲート）に進むためには、以下のすべてが揃っている必要がある:

- [ ] 上記品質基準 5 項目すべて PASS
- [ ] AC マトリクス（Phase 7 で確定済み）の **全 AC（AC-1〜AC-11）が verifiable**（追記後の references / runbook / outputs / Issue 状態を見て真偽判定可能）
- [ ] Phase 12 で作成する strict 7 成果物（`main.md` / `implementation-guide.md` / `system-spec-update-summary.md` / `documentation-changelog.md` / `unassigned-task-detection.md` / `skill-feedback-report.md` / `phase12-task-spec-compliance-check.md`）の **draft 構造** が `outputs/phase-12/` に揃う見込み（タイトル・主要見出しのみで可、本文は Phase 12 で執筆）

---

## セルフレビュー項目（後続実行者が Phase 11 着手前にチェック）

| # | チェック項目 | 確認方法 | 期待 |
| --- | --- | --- | --- |
| 1 | `bash scripts/cf.sh` 経由のみで Cloudflare / D1 にアクセス | runbook §4 / Phase 5 step 3〜5 が `wrangler` 直接実行を含まない | `wrangler` literal hit 0（コメント以外） |
| 2 | redaction 対象 token の理解 | `token` / `bearer` / `secret` / `authorization` の 4 種を暗記 | grep 漏れなく redaction 適用可能 |
| 3 | しきい値の運用方針 | DLQ ≥ 1 / retry ≥ 3 / exhausted 24h は **保守的な初期値**、緩和は別 unassigned task | 初期値で WARN が頻発しても本タスクで再調整しない |
| 4 | references 単一追記 topic の方針 | DLQ 監視 topic は `references/dlq-monitoring.md`（または相当 deployment 系 references の DLQ sub-topic）にのみ追記、他 references に書かない | DRY 違反 grep で他 references hits 0 件を再確認 |
| 5 | Issue #502 / Refs 方針 | CLOSED 維持、再 OPEN しない、PR 文面は `Refs #502` | `Closes #502` を誤って書かない |

---

## 不変条件への影響

| # | 不変条件 | 影響 | 対策 |
| --- | --- | --- | --- |
| 1〜7 | （CLAUDE.md 記載の不変条件すべて） | 影響なし | コード変更なし・docs-only タスクのため、不変条件 1〜7 すべてに影響しない。特に不変条件 5（D1 直接アクセスは `apps/api` に閉じる）は本タスクが `bash scripts/cf.sh d1 execute` 経由 read-only に限定するため抵触しない |

---

## 4 条件評価

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 5 項目の品質基準 + Phase 10 引き渡し条件 + Phase 11 セルフレビューにより、後続実行者が手戻り 0 で Phase 11 / 12 を実行可能 |
| 実現性 | PASS | `rg` / `bash scripts/cf.sh` / `pnpm indexes:rebuild` / `gh api` のみで完結、新規ツール導入なし |
| 整合性 | PASS | 不変条件 1〜7 への影響なし、CONST_004 例外（docs-only）と整合、Phase 8 DRY 化結果と矛盾なし |
| 運用性 | PASS | read-only SQL grep / redaction / EXPLAIN / indexes drift / CODEOWNERS errors の 5 検証が runbook 着手前に機械実行可能 |

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-09/main.md | QA 結果サマリー（5 品質基準 / 引き渡し条件 / セルフレビュー） |
| メタ | artifacts.json | Phase 9 状態の更新 |

---

## 受入条件 / 完了条件チェックリスト

- [ ] 品質基準 5 項目（read-only SQL / redaction / SQL 構文 / indexes drift / CODEOWNERS）すべて PASS 方針
- [ ] AC-1〜AC-11 全件が追記後に verifiable
- [ ] 7 必須 Phase 12 成果物の draft 構造が `outputs/phase-12/` に揃う見込み
- [ ] セルフレビュー 5 項目が phase-09 outputs に記述
- [ ] outputs/phase-09/main.md が作成済み

---

## 受入条件（AC）— index.md と完全一致

- AC-1: Cloudflare Queue / DLQ メトリクス観測手順が runbook に記載
- AC-2: D1 集計 SQL（DLQ 投入 / retry 過剰 / exhausted 滞留）が runbook に記載
- AC-3: 異常しきい値（DLQ ≥ 1、retry ≥ 3、exhausted 24h）文書化
- AC-4: エスカレーション先と次アクション分岐が runbook に明記
- AC-5: aiworkflow-requirements skill `references/` に DLQ 監視 topic 追加
- AC-6: `topic-map.md` / `keywords.json` / `quick-reference.md` / `resource-map.md` drift なし
- AC-7: 集計 SQL が read-only（UPDATE/DELETE/INSERT 不在）
- AC-8: Queue / DLQ binding 名と D1 schema が aiworkflow-requirements から逆引き可
- AC-9: 既存 schema / API contract / Queue 構造の変更なし
- AC-10: 4 条件評価（価値性 / 実現性 / 整合性 / 運用性）全 PASS
- AC-11: Phase 12 strict 7 成果物 + runbook 本体 + aiworkflow-requirements 同期完了

本 Phase は **AC-6（indexes drift）/ AC-7（read-only SQL）** の機械検証を最終固定する責務を担う。

---

## 変更対象ファイル / 関数シグネチャ / unit / integration / e2e tests

**N/A（コード変更なし）**

本タスクは docs-only / CONST_004 例外適用のため、コード単体テスト・統合テスト・E2E テストは存在しない。品質保証は markdown / SQL grep / EXPLAIN QUERY PLAN / indexes rebuild / CODEOWNERS errors ベースの機械検証に置き換える。

---

## 次 Phase への引き渡し

- 次 Phase: 10（最終レビューゲート）
- 引き継ぎ事項: 5 品質基準の合否、AC verifiable 状態、7 必須 Phase 12 成果物 draft の存在、セルフレビュー 5 項目
- ブロック条件: 品質基準のいずれかが FAIL / AC が verifiable でない / Phase 12 strict 7 成果物 draft が揃わない見込み / redaction grep で機微情報混入が判明 / CODEOWNERS errors が空でない

## 実行タスク

- 本 Phase の本文に定義済みの判断、設計、検証、または文書更新を実行する
- docs-only / NON_VISUAL 境界を維持し、コード変更が必要になった場合は Phase 1 の taskType 判定へ戻す

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `docs/30-workflows/issue-502-ut-07b-fu-01-followup-dlq-monitoring-dashboard/index.md` | AC / scope 正本 |
| 必須 | `.claude/skills/task-specification-creator/SKILL.md` | Phase 1-13 / Phase 12 strict 7 files 準拠 |
| 必須 | `.claude/skills/aiworkflow-requirements/SKILL.md` | skill references 同期準拠 |
| 必須 | `scripts/cf.sh` | Cloudflare CLI ラッパー（wrangler 直接実行禁止） |
| 必須 | `.github/CODEOWNERS` | governance path owner |
| 参考 | `docs/30-workflows/issue-497-post-release-dashboard-30day-conclusion/phase-09.md` | docs-only QA フォーマット exemplar |

## 苦戦箇所【記入必須】

- read-only SQL 確認の grep で `last_processed_at` 等カラム名が `update` / `insert` 部分文字列にマッチして false positive が出ることを Phase 7 で予見していた。本 Phase では `^\s*(update|delete|...)\b` という **句頭の SQL 動詞** に regex を限定する具体パターンを確定し、Phase 11 実行時に false positive 0 を担保した
- SQL 構文 check を `bash scripts/cf.sh d1 execute ... --command "EXPLAIN QUERY PLAN <SQL>;"` で実施する場合、staging に fixture が無くても plan が返るが、`julianday('now') - julianday(NULL)` のような NULL 演算は実行時にしか検証されない。本 Phase では「構文 PASS / 値 NULL 時挙動は Phase 11 で `last_processed_at IS NOT NULL` ガード句存在を再確認」と運用条件を明示した
- CODEOWNERS errors の検証を Phase 9 に含めるかで揺れたが、`docs/runbooks/**` を CODEOWNERS の governance path に追加する運用が UT-GOV-003 と整合するため、本タスクで触る path のうち `docs/runbooks/dlq-monitoring/**` が CODEOWNERS の最終マッチ owner と整合することを Phase 9 で機械確認する方針に確定した

## 完了条件

- [ ] 本 Phase の目的、実行タスク、成果物、次 Phase への引き渡しが矛盾なく記録されている
- [ ] docs-only / NON_VISUAL / Issue #502 CLOSED 維持の境界が崩れていない
- [ ] 必要な参照資料と evidence path が実在パスで記録されている

## 統合テスト連携

本タスクは docs-only / NON_VISUAL のため、unit / integration / e2e test の追加は N/A。代替として read-only SQL grep、redaction grep、`EXPLAIN QUERY PLAN`、`pnpm indexes:rebuild` drift 0、CODEOWNERS errors 空、Phase 12 strict 7 files、aiworkflow references 同期を検証ゲートとする。
