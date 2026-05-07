# Phase 12: ドキュメント更新（runbook 本体 / skill references / changelog / indexes）

> [実装区分: ドキュメントのみ]（CONST_004 例外条件適用）
>
> **本仕様書は docs-only タスクであるが、Phase 12 strict 7 成果物 + runbook 本体新設 + aiworkflow-requirements 同期（references / changelog / 4 indexes 再生成）の構成が意味的に分割不可能なため、行数 300〜380 行を許容する**
> （`.claude/skills/task-specification-creator/references/phase-template-phase12.md` §「phase-12.md の 300 行上限と例外条項」準拠）。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | UT-07B-FU-01-FOLLOWUP schema alias back-fill DLQ 監視ダッシュボード整備 |
| Phase 番号 | 12 / 13 |
| Phase 名称 | ドキュメント更新（runbook / skill references / changelog） |
| 作成日 | 2026-05-07 |
| 前 Phase | 11（NON_VISUAL 縮約 / staging 集計 SQL 実行） |
| 次 Phase | 13（PR 作成 / **user_approval_required = true**） |
| 状態 | spec_created（Phase 12 実行後も root workflow_state は維持 / phases[12].status のみ completed） |
| タスク分類 | docs-only（CONST_004 例外） |
| 実装区分 | ドキュメントのみ |
| visualEvidence | NON_VISUAL |
| taskType | docs-only |
| workflow_state | spec_created（docs-only 仕様書作成済み。Phase 12 完了後も root は維持） |
| user_approval_required | true（Phase 13 commit / push / PR 作成に必要） |
| GitHub Issue | #502（CLOSED 据え置き / 再 OPEN 禁止） |
| 変更対象ファイル | `docs/runbooks/dlq-monitoring/schema-alias-backfill.md`（新規）, `.claude/skills/aiworkflow-requirements/references/dlq-monitoring.md`（新規）, `.claude/skills/aiworkflow-requirements/changelog/20260507-issue502-dlq-monitoring.md`（新規）, `.claude/skills/aiworkflow-requirements/indexes/*`（4 indexes 再生成）, 本タスク仕様書配下の outputs |
| 関数シグネチャ | N/A（コード変更なし） |
| unit/integration/e2e tests | N/A（コード変更なし） |

---

## 目的

Phase 11 で取得した staging 集計 SQL 結果（dlq_equivalent / retry_exceeded / exhausted_stale）と Cloudflare dash 観測手順を、(1) `docs/runbooks/dlq-monitoring/schema-alias-backfill.md` 新規 runbook 本体、(2) `.claude/skills/aiworkflow-requirements/references/dlq-monitoring.md` 新規 skill topic、(3) `.claude/skills/aiworkflow-requirements/changelog/20260507-issue502-dlq-monitoring.md` skill changelog fragment に正本化する。同時に `pnpm indexes:rebuild` で 4 indexes（`topic-map.md` / `keywords.json` / `quick-reference.md` / `resource-map.md`）を再生成し drift 0 を確定する。

GitHub Issue #502 は **CLOSED のまま据え置き**。Issue ライフサイクルは再 OPEN せず、`gh issue comment 502` で PR / runbook リンクを残す形で履歴を完結させる。

---

## Phase 12 strict 7 成果物（task-specification-creator skill phase-12-spec.md 準拠）

| # | Task ID | 成果物 | 欠落時の扱い |
| --- | --- | --- | --- |
| 1 | Phase 12 本体 | `outputs/phase-12/main.md` | FAIL |
| 2 | Task 12-1 | `outputs/phase-12/implementation-guide.md`（Part 1 中学生 + Part 2 技術者） | FAIL |
| 3 | Task 12-2 | `outputs/phase-12/system-spec-update-summary.md`（runbook 本体 + skill references diff 概要） | FAIL |
| 4 | Task 12-3 | `outputs/phase-12/documentation-changelog.md`（skill changelog fragment 反映行 + workflow-local 記録） | FAIL |
| 5 | Task 12-4 | `outputs/phase-12/unassigned-task-detection.md`（**0 件でも出力必須**） | FAIL |
| 6 | Task 12-5 | `outputs/phase-12/skill-feedback-report.md`（**改善点なしでも出力必須** / 3 観点固定） | FAIL |
| 7 | Task 12-6 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | FAIL |

上記 7 ファイルが `outputs/phase-12/` 配下に揃うことを Task 6 PASS の前提とする。runbook 本体 `docs/runbooks/dlq-monitoring/schema-alias-backfill.md` は Phase 12 の外部実成果物として別途必須にし、`system-spec-update-summary.md` と `phase12-task-spec-compliance-check.md` から参照する。

---

## workflow_state 取り扱い

| 状態 | docsOnly | github_issue_state | Phase 13 |
| --- | --- | --- | --- |
| Phase 11 未完 | true | CLOSED | 未実行（workflow_state は `spec_created` 維持） |
| Phase 12 完了 | true | CLOSED | 実行（user_approval 必須 / root workflow_state は `spec_created` 維持、`phases[11].status` / `phases[12].status` のみ `completed`） |

- `metadata.docsOnly = true` を維持（コード変更なし）。
- root `workflow_state` は docs-only / spec formalization として `spec_created` を維持する。Phase 13 の user approval gate は `phases[13].status = pending_user_approval` として分離し、root を `completed` / `completed_pending_pr` に上げない。

---

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `.claude/skills/task-specification-creator/references/phase-12-spec.md` | Phase 12 構造定義（必須タスク） |
| 必須 | `.claude/skills/task-specification-creator/references/phase-12-pitfalls.md` | 漏れパターン |
| 必須 | `.claude/skills/task-specification-creator/references/phase-12-documentation-guide.md` | 実装ガイド執筆要領 |
| 必須 | `.claude/skills/task-specification-creator/references/phase-template-phase12.md` | docs-only 系の縮約条項 |
| 必須 | `docs/30-workflows/issue-502-ut-07b-fu-01-followup-dlq-monitoring-dashboard/outputs/phase-11/` | 集計 evidence（本 Phase の入力） |
| 必須 | `.claude/skills/aiworkflow-requirements/references/` | references 追記先（新規 `dlq-monitoring.md`） |
| 必須 | `.claude/skills/aiworkflow-requirements/changelog/` | changelog fragment 追加先 |
| 必須 | `apps/api/wrangler.toml` | Queue / DLQ binding 名の正本 |
| 必須 | `apps/api/src/repository/schemaDiffQueue.ts` | 列更新点の正本 |
| 必須 | `apps/api/migrations/0014_schema_diff_queue_dedupe_failure.sql` | D1 schema の正本 |
| 必須 | `docs/30-workflows/unassigned-task/task-ut-07b-fu-01-followup-dlq-monitoring-dashboard.md` | 起票元 unassigned task spec（trace 追記対象） |
| 必須 | `CLAUDE.md` | 不変条件 / `bash scripts/cf.sh` ラッパールール |

---

## 苦戦箇所【記入必須】

| # | 苦戦箇所 | 想定影響 | 緩和策 |
| --- | --- | --- | --- |
| 1 | runbook 本体の配置先（`docs/runbooks/` 配下 / `apps/api/docs/` / skill references 内）の構造判断ブレ | 後続 follow-up（60 日 / 監視自動化）時に追記方針が定まらず drift | 既存 `docs/runbooks/release-create.md` / `retention-physical-delete.md` / `post-release-long-term-observation.md` と同階層・同命名規約に整合させ `docs/runbooks/dlq-monitoring/schema-alias-backfill.md` を採用、`system-spec-update-summary.md` に明記 |
| 2 | aiworkflow-requirements topic を新規作成するか既存 topic（`database-d1.md` / `deployment-gha.md`）に追記するかの判断ブレ | 単一責務崩壊（DLQ 監視と Queue 構造 / GHA workflow が混在） | DLQ 監視は単独 topic として `dlq-monitoring.md` を新規作成、相互参照は冒頭の関連 topic 行で行う |
| 3 | indexes 再生成要否の判定ブレ | CI `verify-indexes-up-to-date` が FAIL し PR がマージ不可 | 新 topic（dlq-monitoring）の追加は keyword / topic-map / resource-map 全てに新キー追加を伴うため、`mise exec -- pnpm indexes:rebuild` 必須実行を本 Phase に明記 |
| 4 | 起票元 unassigned task spec への trace 追記漏れ | 親（UT-07B-FU-01）と本 follow-up の追跡が切れる | 本 Phase 内 Task 12-7 trace の subtask として `task-ut-07b-fu-01-followup-dlq-monitoring-dashboard.md` 末尾に状態遷移 1 行追加を必須化 |
| 5 | しきい値（DLQ ≥ 1 / retry ≥ 3 / exhausted 24h）が staging 観測値と乖離していた場合の調整方針 | runbook が初動から誤検知過多 | 初期値は保守的に固定し、再観測 3 回後（30 日 / 60 日 / 90 日）に skill changelog で見直す方針を runbook の「しきい値見直し基準」節に明記 |

---

## 4 条件評価

| 条件 | 評価 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | DLQ 監視 runbook が正本化され、Queue / DLQ binding 名 / D1 列名 / migration ID が skill から逆引き可能になる |
| 実現性 | PASS | content-only markdown 追記 + indexes 再生成のみで完結、コード変更ゼロ |
| 整合性 | PASS | AC-1 / AC-2 / AC-3 / AC-4 / AC-5 / AC-6 / AC-8 / AC-11 と直接対応。不変条件 1〜7 全て影響なし |
| 運用性 | PASS | Phase 12 strict 7 成果物 + runbook 本体 + skill 同期で監査追跡可能。Issue #502 reopen 禁止 / `Refs #502` で履歴連結 |

---

## 受入条件（AC 紐付け）

| AC | 紐付け |
| --- | --- |
| AC-1 | runbook 本体「Cloudflare dash 観測手順」節 |
| AC-2 | runbook 本体「集計 SQL 3 種」節 |
| AC-3 | runbook 本体「異常しきい値」節（DLQ ≥ 1 / retry ≥ 3 / exhausted 24h） |
| AC-4 | runbook 本体「エスカレーション分岐」節 |
| AC-5 | `references/dlq-monitoring.md` 新規追加 |
| AC-6 | topic-map / keywords / quick-reference / resource-map / task-workflow-active / SKILL / LOGS の Issue #502 導線 |
| AC-8 | runbook + `references/dlq-monitoring.md` で Queue / DLQ binding 名 + D1 列 + migration を相互参照 |
| AC-11 | Phase 12 strict 7 成果物 + runbook 本体 + aiworkflow-requirements 同期完了 |

---

## 実行手順

### Task 12-1: 実装ガイド作成（`outputs/phase-12/implementation-guide.md`）

1 ファイル内で **Part 1 + Part 2** を 2 部構成で記述する。

**Part 1（中学生レベル / 例え話 + 専門用語回避）必須要件**:

- 「Queue（行列の自動受付）」「DLQ（処理に失敗したものを置く別の箱）」「retry_count（同じ仕事を何回リトライしたか）」「exhausted（CPU 時間切れで一旦やめた状態）」を日常語で例える
- 「DLQ ≥ 1」を「失敗箱に 1 件でも入っていたら、まず中身を見にいく」と例える
- 「retry ≥ 3」を「同じ仕事に 3 回続けて失敗していたら、その仕事自体に問題がある可能性を疑う」と例える
- 「exhausted 24h」を「中断状態のまま 24 時間動き出さない仕事は、忘れられている可能性が高い」と例える
- 専門用語セルフチェック: 「Cloudflare Queue」「D1」「Workers」「dead-letter」を使う場合は括弧書きで日常語を補う

**Part 2（技術者レベル）必須要件**:

- Queue binding（`SCHEMA_ALIAS_BACKFILL_QUEUE`）/ Queue 名（prod=`schema-alias-backfill` / staging=`schema-alias-backfill-staging`）/ DLQ 名（prod=`schema-alias-backfill-dlq` / staging=`schema-alias-backfill-staging-dlq`）の正本値表
- D1 table `schema_diff_queue` 列定義（`retry_count` / `failed_items_json` / `last_error` / `last_processed_at` / `backfill_status`）と migration `0014_schema_diff_queue_dedupe_failure.sql` の参照
- 集計 SQL 3 種の完全形（DLQ 相当 / retry 過剰 / exhausted 24h）と read-only 性
- Cloudflare dash 到達経路（Workers & Pages → Queues → 該当 queue 名）
- しきい値判定マトリクス（DLQ ≥ 1 / retry ≥ 3 / exhausted 24h）と次アクション分岐
- Phase 11 staging 数値（dlq_equivalent / retry_exceeded / exhausted_stale）の転記表
- `bash scripts/cf.sh d1 execute` 経由実行の必須性（wrangler 直接禁止ポリシー）

### Task 12-2: システム仕様書更新（`outputs/phase-12/system-spec-update-summary.md`）

更新対象:

1. `docs/runbooks/dlq-monitoring/schema-alias-backfill.md`（新規）
2. `.claude/skills/aiworkflow-requirements/references/dlq-monitoring.md`（新規）
3. `.claude/skills/aiworkflow-requirements/indexes/*` + `references/task-workflow-active.md` + `SKILL.md` + `LOGS/_legacy.md`（正本導線同期）

**runbook 本体構造**:

```markdown
# schema alias back-fill DLQ 監視 runbook

## 1. 監視対象
- Queue: SCHEMA_ALIAS_BACKFILL_QUEUE（prod=schema-alias-backfill / staging=schema-alias-backfill-staging）
- DLQ: schema-alias-backfill-dlq / schema-alias-backfill-staging-dlq
- D1 table: schema_diff_queue（migration 0014）

## 2. Cloudflare dash 観測手順（AC-1）
（Workers & Pages → Queues → 該当 queue → Messages / Dead-letters / Retries）

## 3. 集計 SQL 3 種（AC-2 / AC-7）
### 3.1 DLQ 相当
### 3.2 retry 過剰
### 3.3 exhausted 滞留 24h 超

## 4. 異常しきい値（AC-3）
| しきい値 | 条件 | 次アクション |
| DLQ ≥ 1 | failed_items_json IS NOT NULL の件数 ≥ 1 | dash で DLQ 内容確認 |
| retry ≥ 3 | retry_count ≥ 3 件数 ≥ 1 | redacted evidence を確認 + root cause 分類（`last_error` 原文は転記しない） |
| exhausted 24h | `backfill_status='exhausted'` AND `last_processed_at <= datetime('now','-24 hours')` | Cron 起動状況確認 |

## 5. エスカレーション分岐（AC-4）
- 軽微（再 enqueue で復旧見込み）→ 運用者手動再投入
- 中度（schema drift / GraphQL 5xx）→ 別 unassigned task 起票
- 重度（CPU budget 永続超過 / DB 制約違反）→ rollback + Issue 起票

## 6. しきい値見直し基準
30 日 / 60 日 / 90 日の再観測タイミングで skill changelog に見直し記録

## 7. 関連
- apps/api/wrangler.toml / apps/api/migrations/0014_schema_diff_queue_dedupe_failure.sql / apps/api/src/repository/schemaDiffQueue.ts
```

**skill references `dlq-monitoring.md` 構造**:

- Trigger キーワード（DLQ / dead-letter / schema-alias-backfill / retry_count / failed_items_json / exhausted）
- runbook 本体への 1-hop link
- Queue / DLQ binding 名と D1 列の逆引きリスト（AC-8）

**indexes / 正本導線同期要否**:

- `topic-map.md` / `keywords.json` は新 topic 追加に伴う `mise exec -- pnpm indexes:rebuild` 由来の差分
- `quick-reference.md` / `resource-map.md` / `task-workflow-active.md` / `SKILL.md` / `LOGS/_legacy.md` は Issue #502 逆引き導線として同一 wave で手動追記

### Task 12-3: ドキュメント更新履歴（`outputs/phase-12/documentation-changelog.md`）

`.claude/skills/aiworkflow-requirements/changelog/20260507-issue502-dlq-monitoring.md` への反映例:

```markdown
# Issue #502 schema alias back-fill DLQ monitoring runbook

- `references/dlq-monitoring.md` を新規追加し、Cloudflare Queue / DLQ 観測手順 + D1 集計 SQL 3 種 + しきい値（DLQ ≥ 1 / retry ≥ 3 / exhausted 24h）を正本化。
- runbook 本体は `docs/runbooks/dlq-monitoring/schema-alias-backfill.md` に配置。
- Phase 11 evidence は `docs/30-workflows/issue-502-ut-07b-fu-01-followup-dlq-monitoring-dashboard/outputs/phase-11/aggregation.md` / `dash-observation.md` を正本とする。実 D1 SQL / dash runtime evidence は user approval 後に追記する。
- GitHub Issue は #502 CLOSED 維持。PR 文面は `Refs #502` のみ。
```

workflow-local close-out 行:

```markdown
| 2026-05-07 | issue-502 | spec_created / Phase11=contract_ready_runtime_pending / Phase12=completed / Phase13=pending_user_approval | schema alias back-fill DLQ 監視 runbookを docs/runbooks 配下と aiworkflow-requirements references に正本化 |
```

両ブロックを `documentation-changelog.md` に分けて記録する（workflow-local / aiworkflow skill changelog fragment 別ブロック）。

### Task 12-4: 未タスク検出レポート（`outputs/phase-12/unassigned-task-detection.md`）/ **0 件でも出力必須**

- 期待される 0 件文言: 「DLQ 監視 runbook 整備の結果、追加未タスクなし。Pager / 通知基盤の自動化、しきい値の自動調整、CPU budget 監視の dashboard 化は scope 外（含まないに該当）であり、本 follow-up の責務外。」
- 必要であれば「次の段階で観測すべき項目」として「DLQ 件数の時系列推移を CSV 化する補助スクリプト」「retry_count ヒストグラム」を **観察事項のみ**として記録する。実装が必要な未タスクへ昇格する場合は CONST_005 に従い、理由・実施場所・実施時期を明記してユーザーにエスカレーションしてから formalize する。
- 4 パターン照合表（型定義→実装 / 契約→テスト / UI→component / 仕様間差異→設計決定）を 0 件でも明記し、本タスクが docs-only であるため全パターン非該当である根拠を残す

### Task 12-5: スキルフィードバックレポート（`outputs/phase-12/skill-feedback-report.md`）/ **改善点なしでも出力必須 / 3 観点固定**

| 観点 | フィードバック | 改善提案 |
| --- | --- | --- |
| テンプレ改善（task-specification-creator） | docs-only / NON_VISUAL タスクで「runbook 本体」を成果物に含む構成のテンプレが phase-12-spec.md に明示されていない | `phase-12-spec.md` の必須成果物リストに「runbook 本体（任意）」を例示として追加する案 |
| ワークフロー改善 | `bash scripts/cf.sh d1 execute` 経由の集計 SQL を runbook draft に直接埋め込む際の SQL escape 規約が暗黙 | `scripts/cf.sh` README に SQL escape 規約節を追加する案 |
| ドキュメント改善（aiworkflow-requirements） | `references/` 配下に「monitoring / observability」サブカテゴリが未確立 | DLQ 監視 / GHA conclusion / D1 retention など監視系 topic を `references/monitoring/` 配下に再編する案（次 follow-up 議論） |

> 改善点なしの観点があれば「観察事項のみ / なし」を 3 観点で必ず明記する。

### Task 12-6: タスク仕様書コンプライアンスチェック（`outputs/phase-12/phase12-task-spec-compliance-check.md`）

| チェック項目 | 基準 | 期待 |
| --- | --- | --- |
| Phase 12 strict 7 成果物が揃っている | main / implementation-guide / spec-update-summary / changelog / unassigned-detection / skill-feedback / compliance-check | PASS |
| runbook 本体が `docs/runbooks/dlq-monitoring/schema-alias-backfill.md` に配置 | 既存 runbooks 階層に整合 | PASS |
| implementation-guide が Part 1 / Part 2 構成 | Part 1 例え話 + 専門用語セルフチェック / Part 2 binding / SQL / 分岐 | PASS |
| runbook 6 章構造 | 監視対象 / dash 手順 / 集計 SQL 3 種 / しきい値 / エスカレーション / しきい値見直し基準 | PASS |
| aiworkflow-requirements references 新規 topic | `dlq-monitoring.md` 作成 | PASS |
| changelog fragment | `changelog/20260507-issue502-dlq-monitoring.md` 作成 | PASS |
| indexes / 正本導線同期 | topic-map / keywords / quick-reference / resource-map / task-workflow-active / SKILL / LOGS に Issue #502 導線 | PASS_BOUNDARY |
| 起票元 unassigned task spec への trace | `task-ut-07b-fu-01-followup-dlq-monitoring-dashboard.md` 末尾に 1 行追加 | PASS |
| 集計 SQL が read-only | `INSERT` / `UPDATE` / `DELETE` / `DROP` / `ALTER` 不在 | PASS |
| Queue / DLQ binding 名と D1 schema 逆引き | runbook + skill references で相互参照 | PASS |
| `metadata.docsOnly=true` / `github_issue_state=CLOSED` | 維持 | PASS |
| 不変条件 #1〜#7 | 影響なし | PASS |
| Issue #502 再 OPEN 禁止 | `gh issue reopen` 不実行 | PASS |
| Phase 13 連動 | PR title `docs: add DLQ monitoring runbook for UT-07B-FU-01 schema alias back-fill (Refs #502)` | PASS |

---

## Task 12-7: 起票元 unassigned task spec への trace + runbook 本体作成

### runbook 本体作成

対象: `docs/runbooks/dlq-monitoring/schema-alias-backfill.md`（新規）

「Task 12-2 runbook 本体構造」に従い 6 章構造で実装する。冒頭に Phase 11 staging 数値（dlq_equivalent / retry_exceeded / exhausted_stale）を「サンプル実行結果（staging YYYY-MM-DD）」として転記する。これは Phase 12 strict 7 ファイルとは別の必須実成果物であり、欠落時は `phase12-task-spec-compliance-check.md` を FAIL にする。

### 起票元 unassigned task spec trace 追記

対象ファイル: `docs/30-workflows/unassigned-task/task-ut-07b-fu-01-followup-dlq-monitoring-dashboard.md`

末尾追記行例:

```markdown
## 状態遷移

- 2026-05-07: 本仕様書 issue-502 (`docs/30-workflows/issue-502-ut-07b-fu-01-followup-dlq-monitoring-dashboard/`) として正式化。runbook 本体は `docs/runbooks/dlq-monitoring/schema-alias-backfill.md` に配置。root workflow_state は `spec_created` を維持し、Phase 11 は `contract_ready_runtime_pending`、Phase 12 は `completed`、Phase 13 は `pending_user_approval` とする。Refs #502
```

---

## aiworkflow-requirements skill 同期チェックリスト

| 同期対象 | パス | 必須 |
| --- | --- | --- |
| references 新規追加 | `.claude/skills/aiworkflow-requirements/references/dlq-monitoring.md` | YES |
| changelog | `.claude/skills/aiworkflow-requirements/changelog/20260507-issue502-dlq-monitoring.md` | YES |
| indexes 再生成 | `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` / `keywords.json` / `quick-reference.md` / `resource-map.md` | YES（新 topic につき必須） |
| active workflow sync | `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | YES（issue-502 formalized docs-only entry） |
| LOGS / changelog trace | `.claude/skills/aiworkflow-requirements/changelog/20260507-issue502-dlq-monitoring.md` または既存 LOGS fragment | YES（記録先を `system-spec-update-summary.md` に明記） |
| artifact inventory | `.claude/skills/aiworkflow-requirements/references/workflow-issue-502-dlq-monitoring-artifact-inventory.md` | 条件付き（既存 inventory 方針に合わせ、作成しない場合は理由を明記） |
| workflow-local close-out | `outputs/phase-12/documentation-changelog.md` | YES |

---

## GitHub Issue #502 への comment（reopen 禁止）

```bash
# Phase 13 PR merge 後に実行
gh issue comment 502 --body "PR <PR URL> でマージ済み。runbook: docs/runbooks/dlq-monitoring/schema-alias-backfill.md / 仕様書: docs/30-workflows/issue-502-ut-07b-fu-01-followup-dlq-monitoring-dashboard/"
```

- Issue #502 は **CLOSED 据え置き**。`gh issue reopen 502` を実行しない。
- close-twice も避ける（既に CLOSED のため `gh issue close` も実行しない）。

---

## 完了条件チェックリスト

- [ ] Phase 12 strict 7 成果物（main + Task 12-1〜12-6）が `outputs/phase-12/` 配下に揃っている
- [ ] runbook 本体 `docs/runbooks/dlq-monitoring/schema-alias-backfill.md` が 6 章構造で作成
- [ ] implementation-guide が Part 1（中学生）と Part 2（技術者）構成で例え話 + 専門用語セルフチェック済
- [ ] system-spec-update-summary に runbook 構造 / skill references 構造 / indexes 再生成方針が明記
- [ ] documentation-changelog で aiworkflow-requirements changelog fragment と workflow-local close-out が別ブロックで記録
- [ ] unassigned-task-detection が 0 件でも出力され、4 パターン照合表が記載
- [ ] skill-feedback-report が「テンプレ改善 / ワークフロー改善 / ドキュメント改善」3 観点で出力（改善点なしでも出力）
- [ ] phase12-task-spec-compliance-check の全項目が PASS
- [ ] 起票元 unassigned task spec 末尾に状態遷移 trace 1 行追加済
- [ ] aiworkflow-requirements skill 同期完了（references 新規 + changelog + indexes 再生成）
- [ ] topic-map / keywords / quick-reference / resource-map / task-workflow-active / SKILL / LOGS に Issue #502 導線が存在
- [ ] 集計 SQL 3 種に改変系 keyword 不在
- [ ] artifacts.json が `workflow_state = spec_created` を維持し、Phase 12 実行後は `phases[11].status = contract_ready_runtime_pending` / `phases[12].status = completed` / `phases[13].status = pending_user_approval` に整合
- [ ] `metadata.docsOnly = true` / `metadata.github_issue_state = "CLOSED"` を維持
- [ ] 不変条件 #1〜#7 影響なし（コード変更なし）
- [ ] GitHub Issue #502 を再 OPEN していない

---

## 不変条件への影響

| # | 不変条件 | 影響 |
| --- | --- | --- |
| 1〜7 | 全項目 | **影響なし**（コード変更なし / markdown 追記 + indexes 再生成のみ） |

---

## 成果物（必須 7 + runbook 本体）

| 種別 | パス | 説明 |
| --- | --- | --- |
| 集約 | `outputs/phase-12/main.md` | Phase 12 index / 7 成果物ナビ |
| ガイド | `outputs/phase-12/implementation-guide.md` | Part 1（中学生）+ Part 2（技術者） |
| サマリー | `outputs/phase-12/system-spec-update-summary.md` | runbook + skill references + indexes 再生成 diff 概要 |
| 履歴 | `outputs/phase-12/documentation-changelog.md` | aiworkflow-requirements changelog fragment / workflow-local close-out 記録 |
| 検出 | `outputs/phase-12/unassigned-task-detection.md` | 0 件出力 + 4 パターン照合表 |
| FB | `outputs/phase-12/skill-feedback-report.md` | 3 観点固定 |
| 検証 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | 全項目 PASS 期待 |
| runbook | `docs/runbooks/dlq-monitoring/schema-alias-backfill.md` | 監視 runbook 本体（6 章構造） |
| skill | `.claude/skills/aiworkflow-requirements/references/dlq-monitoring.md` | 新規 topic |
| changelog | `.claude/skills/aiworkflow-requirements/changelog/20260507-issue502-dlq-monitoring.md` | skill changelog fragment |
| indexes | `.claude/skills/aiworkflow-requirements/indexes/{topic-map.md,keywords.json,quick-reference.md,resource-map.md}` | 4 indexes 再生成 |
| メタ | `artifacts.json`（root） | `workflow_state = spec_created` 維持、Phase 個別 status のみ更新。`outputs/artifacts.json` は本ワークフローでは作成されておらず、root `artifacts.json` が唯一正本である。 |

---

## 次 Phase への引き渡し

- 次 Phase: 13（PR 作成 / **user_approval_required = true**）
- 引き継ぎ事項:
  - documentation-changelog の変更ファイル一覧 → PR description 草案の根拠
  - phase12-compliance-check の PASS 判定 → Phase 13 承認ゲートの前提条件
  - runbook 本体パス + skill references パス + changelog fragment パス → PR body の declared files
  - Issue #502 CLOSED 据え置き / `Refs #502` 採用方針を Phase 13 PR body に明記
- ブロック条件:
  - 必須 7 成果物のいずれかが欠落
  - runbook 本体未配置
  - aiworkflow-requirements 同期未完了（references / changelog / indexes 再生成）
  - 起票元 unassigned task spec への trace 追記漏れ
  - GitHub Issue #502 を再 OPEN してしまった
  - PR body 草案に `Closes #502` を採用してしまった

## 実行タスク

- 本 Phase の本文に定義済みの判断、設計、検証、または文書更新を実行する。
- docs-only / NON_VISUAL 境界を維持し、コード変更が必要になった場合は Phase 1 の taskType 判定へ戻す。
