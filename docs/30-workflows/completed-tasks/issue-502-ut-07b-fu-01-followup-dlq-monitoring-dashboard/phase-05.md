# Phase 5: 仕様 runbook 作成（DLQ 監視ダッシュボード / D1 集計 SQL / Cloudflare dash 観測手順）

[実装区分: ドキュメントのみ]

## メタ情報

| 項目 | 値 |
| ---- | ---- |
| タスク名 | schema alias back-fill Queue / DLQ 監視ダッシュボード整備 (issue-502) |
| GitHub Issue | #502（CLOSED 維持 / `Refs #502`） |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 仕様 runbook 作成 |
| 作成日 | 2026-05-07 |
| 前 Phase | 4（検証戦略） |
| 次 Phase | 6（異常系） |
| 状態 | spec_created |
| タスク分類 | docs-only（runbook 中核） |
| taskType | docs-only（CONST_004 例外適用） |
| visualEvidence | NON_VISUAL |
| Wave | 2 |
| 優先度 | low |
| 規模 | small |
| 実装区分 | **ドキュメントのみ** |

## 目的

本 Phase は issue-502 の **runbook 中核** として、後続実行者が **そのまま実行可能な D1 集計 SQL / Cloudflare dash 観測手順 / 異常しきい値 / エスカレーション分岐** を確定する。CONST_005 必須項目のうちコード関連は **N/A（コード変更なし）** とし、代わりに「変更対象ファイル（runbook + skill references + changelog）」「ローカル実行コマンド（`bash scripts/cf.sh d1 execute ...`）」「DoD」を実装仕様書同等の粒度で正本化する。

成果物は (1) 新規 runbook `docs/runbooks/dlq-monitoring/schema-alias-backfill.md`（章構成と read-only SQL 完成形）、(2) `.claude/skills/aiworkflow-requirements/references/` への DLQ 監視 topic 追加、(3) `aiworkflow-requirements/changelog/` への 1 行追加、の 3 点に閉じる。

## 完了条件チェックリスト

- [ ] step 1〜9 が実行可能なコマンド付きで列挙されている
- [ ] 「変更対象ファイル」が表で確定している（runbook + references + changelog + outputs）
- [ ] runbook の章構成（背景 / 観測対象 / Cloudflare dash 観測手順 / D1 集計 SQL 3 種 / 異常しきい値 / エスカレーション）が決定している
- [ ] 「関数シグネチャ / unit / integration / e2e tests」は **N/A（コード変更なし）** と明記されている
- [ ] D1 集計 SQL 3 種（DLQ 投入 / retry 過剰 / exhausted 滞留）が **完成形・read-only** として記載されている
- [ ] `bash scripts/cf.sh d1 execute ...` の sequence が wrangler 直接実行を含まず網羅されている
- [ ] 異常しきい値（DLQ ≥ 1 / retry ≥ 3 / exhausted 24h）と次アクション分岐が明記されている
- [ ] DoD（AC-1〜AC-11 全 PASS / `outputs/phase-11/` 揃い / skill references diff 記録 / Issue #502 CLOSED 据え置き）が記述されている
- [ ] 不変条件への影響が「なし」と明記されている

## 1. 変更対象ファイル一覧

| パス | 区分 | 役割 |
| --- | --- | --- |
| `docs/runbooks/dlq-monitoring/schema-alias-backfill.md` | 新規 | DLQ 監視 runbook 本体（背景 / 観測対象 / dash 手順 / SQL 3 種 / しきい値 / エスカレーション） |
| `.claude/skills/aiworkflow-requirements/references/dlq-monitoring.md` | 新規 or 既存 deployment 系 references への追記 | Queue / DLQ binding 名 + D1 schema 監視列 + runbook link を skill から逆引き可能化 |
| `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` | 編集 | DLQ 監視 topic を追加 |
| `.claude/skills/aiworkflow-requirements/indexes/keywords.json` | 編集 | `dlq` / `schema-alias-backfill` / `schema_diff_queue` 等の語彙を追加 |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | 編集 | DLQ 監視 quick-ref 行を追加 |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | 編集 | runbook path / Queue binding / D1 table を resource-map に登録 |
| `.claude/skills/aiworkflow-requirements/changelog/20260507-issue502-dlq-monitoring.md` | 新規 | runbook 正本化を 1 行で記録 |
| `docs/30-workflows/issue-502-ut-07b-fu-01-followup-dlq-monitoring-dashboard/outputs/phase-11/` | 新規 | SQL 実行 trace（read-only）/ redaction-grep log / dash 観測手順テキスト |
| `docs/30-workflows/issue-502-ut-07b-fu-01-followup-dlq-monitoring-dashboard/outputs/phase-12/skill-references-diff.md` | 新規 | references 差分記録 |

> 関数シグネチャ / 型定義 / unit tests / integration tests / e2e tests: **N/A（コード変更なし）**
> 既存コード（`apps/api/src/repository/schemaDiffQueue.ts` / `apps/api/wrangler.toml` / `apps/api/migrations/0014_schema_diff_queue_dedupe_failure.sql`）は **read-only 参照のみ**。

## 2. runbook 章構成（`docs/runbooks/dlq-monitoring/schema-alias-backfill.md`）

```markdown
# schema alias back-fill DLQ 監視 runbook

## 1. 背景
- UT-07B-FU-01 で Cloudflare Queue / Cron split を導入し、`SCHEMA_ALIAS_BACKFILL_QUEUE` binding と DLQ（`schema-alias-backfill-dlq` / staging 版）を作成した
- ランタイム上の Queue 滞留・DLQ 投入・retry 過剰は `schema_diff_queue` の `failed_items_json` / `retry_count` / `last_processed_at` / `backfill_status` 列に永続化される。`last_error` は機微情報混入防止のため集計 SQL では SELECT しない。
- 本 runbook はそれらを単一ビューで観測する正本

## 2. 観測対象
| 観測項目 | 取得元 | 取得方法 |
| --- | --- | --- |
| DLQ 投入件数 | Cloudflare Queue Analytics（DLQ）/ D1 `failed_items_json IS NOT NULL` | dash + 集計 SQL #1 |
| retry 過剰件数 | D1 `schema_diff_queue.retry_count` | 集計 SQL #2 |
| exhausted 滞留期間 | D1 `schema_diff_queue.backfill_status='exhausted'` + `last_processed_at` | 集計 SQL #3 |
| Queue messages / dead-letters / retries | Cloudflare dash > Workers > Queues | 手動 dash 観測 |

## 3. Cloudflare dash 観測手順（手動）
1. Cloudflare dash にログイン（`scripts/cf.sh whoami` で先に認証確認）
2. Workers & Pages > Queues > `schema-alias-backfill`（prod）または `schema-alias-backfill-staging` を選択
3. Metrics タブで「Messages produced / consumed / dead-lettered / retries」を 24h / 7d で確認
4. DLQ（`schema-alias-backfill-dlq` / staging 版）を選択し dead-letter messages の滞留有無を確認
5. dash 上で異常を検知したら本 runbook §5 のしきい値判定へ進む

## 4. D1 集計 SQL（read-only）
SQL #1: DLQ 投入相当（`failed_items_json IS NOT NULL`）
SQL #2: retry 過剰（`retry_count >= 3`）
SQL #3: exhausted 滞留（`backfill_status='exhausted'` かつ `last_processed_at` が 24h 以上前）

## 5. 異常しきい値
- DLQ 投入 ≥ 1 件 → 要調査
- `retry_count` ≥ 3 → 要調査
- `backfill_status='exhausted'` の滞留 ≥ 24h → 要調査

## 6. エスカレーション
- 上記いずれかに該当: 担当 owner（リポジトリ admin）に通知し、UT-07B-FU-01 の Phase 12 unassigned-task 起票判断へ
- 該当なし: dash 観測ログを記録して終了
```

## 3. 実行 step sequence

### step 1: 観測対象の棚卸し（read-only）

```bash
# wrangler.toml の Queue / DLQ binding 確認（grep のみ・実 wrangler 呼び出し禁止）
rg -n "SCHEMA_ALIAS_BACKFILL_QUEUE|schema-alias-backfill" apps/api/wrangler.toml \
  | tee docs/30-workflows/issue-502-ut-07b-fu-01-followup-dlq-monitoring-dashboard/outputs/phase-11/binding-grep.log

# repository の更新点確認
rg -n "retry_count|failed_items_json|last_error|last_processed_at|backfill_status|exhausted" \
  apps/api/src/repository/schemaDiffQueue.ts \
  > docs/30-workflows/issue-502-ut-07b-fu-01-followup-dlq-monitoring-dashboard/outputs/phase-11/repository-grep.log

# migration 確認
rg -n "schema_diff_queue|retry_count|failed_items_json" \
  apps/api/migrations/0014_schema_diff_queue_dedupe_failure.sql \
  > docs/30-workflows/issue-502-ut-07b-fu-01-followup-dlq-monitoring-dashboard/outputs/phase-11/migration-grep.log
```

### step 2: Cloudflare dash 観測（手動 / テキスト記録）

```bash
# 認証確認のみ
bash scripts/cf.sh whoami \
  | tee docs/30-workflows/issue-502-ut-07b-fu-01-followup-dlq-monitoring-dashboard/outputs/phase-11/cf-whoami.log
```

dash 観測の trace は `outputs/phase-11/dash-observation.md` に手動記録する。NON_VISUAL のため screenshot / `screenshots/` ディレクトリは作成しない。

### step 3: D1 集計 SQL #1 — DLQ 投入相当の集計

```bash
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging --command "
SELECT COUNT(*) AS dlq_pending,
       MIN(last_processed_at) AS oldest_failed_at,
       MAX(last_processed_at) AS newest_failed_at
  FROM schema_diff_queue
 WHERE failed_items_json IS NOT NULL;
" \
  | tee docs/30-workflows/issue-502-ut-07b-fu-01-followup-dlq-monitoring-dashboard/outputs/phase-11/sql-1-dlq-pending.log
```

期待: staging で read-only に件数 / 最古 / 最新 failed timestamp が返る。production 実行はユーザー明示承認後の別操作とし、本 Phase 11 evidence には使わない。

### step 4: D1 集計 SQL #2 — retry 過剰の集計

```bash
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging --command "
SELECT diff_id, retry_count, last_processed_at
  FROM schema_diff_queue
 WHERE retry_count >= 3
 ORDER BY retry_count DESC, last_processed_at DESC
 LIMIT 50;
" \
  | tee docs/30-workflows/issue-502-ut-07b-fu-01-followup-dlq-monitoring-dashboard/outputs/phase-11/sql-2-retry-excess.log
```

`last_error` は redaction 観点で SELECT しない。root cause 分類が必要な場合は、別途ユーザー承認付きの機微情報確認手順として扱う。

### step 5: D1 集計 SQL #3 — exhausted 滞留の集計

```bash
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging --command "
SELECT diff_id, backfill_status, retry_count, last_processed_at,
       CAST((julianday('now') - julianday(last_processed_at)) * 24 AS INTEGER) AS stalled_hours
  FROM schema_diff_queue
 WHERE backfill_status = 'exhausted'
   AND last_processed_at IS NOT NULL
   AND julianday('now') - julianday(last_processed_at) >= 1.0
 ORDER BY last_processed_at ASC
 LIMIT 50;
" \
  | tee docs/30-workflows/issue-502-ut-07b-fu-01-followup-dlq-monitoring-dashboard/outputs/phase-11/sql-3-exhausted-stalled.log
```

`julianday('now') - julianday(...) >= 1.0` で 24h 以上滞留を検出。read-only。

### step 6: 集計結果の runbook 反映

step 3〜5 の出力を `outputs/phase-11/aggregation.md` に転記し、以下表で構造化する。

```markdown
| 指標 | 値 | しきい値 | 判定 |
| --- | --- | --- | --- |
| DLQ 投入件数 | N | ≥ 1 | PASS / WARN |
| retry_count ≥ 3 件数 | N | ≥ 1 | PASS / WARN |
| exhausted 24h 以上滞留件数 | N | ≥ 1 | PASS / WARN |
```

### step 7: redaction grep（必須 / Cloudflare stderr・SQL 出力対策）

```bash
rg -i "(token|bearer|secret|authorization)" \
  docs/30-workflows/issue-502-ut-07b-fu-01-followup-dlq-monitoring-dashboard/outputs/phase-11/sql-*.log \
  > docs/30-workflows/issue-502-ut-07b-fu-01-followup-dlq-monitoring-dashboard/outputs/phase-11/redaction-grep.log || true

wc -l docs/30-workflows/issue-502-ut-07b-fu-01-followup-dlq-monitoring-dashboard/outputs/phase-11/redaction-grep.log
```

- マッチ **あり** → 該当原文を runbook / skill references に **転記しない**。要約（例: 「Forms API 401」）のみを記録
- マッチ **なし** → 空ファイルとして保存し AC-7 の証跡

### step 8: skill references 追記

追記先: `.claude/skills/aiworkflow-requirements/references/dlq-monitoring.md`（新規）または既存 `deployment-gha.md` / 同等 deployment 系 references の DLQ 章。

セクション構造:

```markdown
# DLQ 監視 — schema alias back-fill

## Queue / DLQ binding
| 環境 | Queue | DLQ |
| --- | --- | --- |
| production | `schema-alias-backfill` | `schema-alias-backfill-dlq` |
| staging | `schema-alias-backfill-staging` | `schema-alias-backfill-staging-dlq` |
| binding 変数名 | `SCHEMA_ALIAS_BACKFILL_QUEUE` | （consumer 側で参照） |

## 観測対象 D1 列（`schema_diff_queue`）
- `retry_count`
- `failed_items_json`
- `last_error` は SELECT しない。Cloudflare CLI stderr / D1 output に出た error summary は原文転記せず要約する。
- `last_processed_at`
- `status`（`exhausted` を監視）

## 異常しきい値
- DLQ 投入件数 ≥ 1
- `retry_count` ≥ 3
- `backfill_status='exhausted'` 滞留 ≥ 24h

## runbook link
`docs/runbooks/dlq-monitoring/schema-alias-backfill.md`

## エスカレーション
リポジトリ admin → UT-07B-FU-01 Phase 12 unassigned-task 判断
```

### step 9: changelog 1 行追加 + indexes drift 確認

```bash
# changelog
cat <<'MD' >> .claude/skills/aiworkflow-requirements/changelog/20260507-issue502-dlq-monitoring.md
| v2026.05.07-issue502-dlq-monitoring | 2026-05-07 | schema alias back-fill Queue / DLQ 監視 runbook と D1 集計 SQL 3 種を正本化、references / topic-map / keywords / quick-reference / resource-map に DLQ 監視 topic を追加 |
MD

# indexes 再生成
mise exec -- pnpm indexes:rebuild
git diff .claude/skills/aiworkflow-requirements/indexes
```

drift があれば commit 対象、無ければ skip。AC-6 の証跡。

## 4. 入出力 / 副作用

| step | 入力 | 出力 | 副作用 |
| --- | --- | --- | --- |
| 1 | `wrangler.toml` / repository / migration | `binding-grep.log` / `repository-grep.log` / `migration-grep.log` | read-only |
| 2 | なし | `cf-whoami.log` / `dash-observation.md`（手動） | read-only（認証確認のみ） |
| 3 | D1（read-only） | `sql-1-dlq-pending.log` | read-only SQL のみ |
| 4 | D1（read-only） | `sql-2-retry-excess.log` | read-only SQL のみ |
| 5 | D1（read-only） | `sql-3-exhausted-stalled.log` | read-only SQL のみ |
| 6 | step 3〜5 出力 | `aggregation.md` | read-only |
| 7 | step 3〜5 出力 | `redaction-grep.log` | read-only |
| 8 | step 6 出力 | `references/dlq-monitoring.md` 編集 | skill references 追記 |
| 9 | step 8 出力 | changelog 1 行追加 / indexes rebuild | skill changelog 編集 + indexes 再生成 |

## 5. ローカル実行コマンド（一括）

```bash
# 前提: scripts/cf.sh whoami が成功 / cwd = リポジトリ root
TASK_DIR=docs/30-workflows/issue-502-ut-07b-fu-01-followup-dlq-monitoring-dashboard
mkdir -p ${TASK_DIR}/outputs/phase-11 ${TASK_DIR}/outputs/phase-12

# step 1
rg -n "SCHEMA_ALIAS_BACKFILL_QUEUE|schema-alias-backfill" apps/api/wrangler.toml \
  > ${TASK_DIR}/outputs/phase-11/binding-grep.log
rg -n "retry_count|failed_items_json|last_error|last_processed_at|backfill_status|exhausted" \
  apps/api/src/repository/schemaDiffQueue.ts \
  > ${TASK_DIR}/outputs/phase-11/repository-grep.log

# step 2
bash scripts/cf.sh whoami > ${TASK_DIR}/outputs/phase-11/cf-whoami.log

# step 3〜5（production の例 / staging は env 置換）
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging \
  --command "SELECT COUNT(*) AS dlq_pending FROM schema_diff_queue WHERE failed_items_json IS NOT NULL;" \
  > ${TASK_DIR}/outputs/phase-11/sql-1-dlq-pending.log

# step 7
rg -i "(token|bearer|secret|authorization)" ${TASK_DIR}/outputs/phase-11/sql-*.log \
  > ${TASK_DIR}/outputs/phase-11/redaction-grep.log || true

# step 9
mise exec -- pnpm indexes:rebuild
```

## 6. 受入条件（AC）— index.md と完全一致

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

本 Phase は **AC-1〜AC-9** の達成手順を確定する責務を担う。AC-10 / AC-11 は Phase 7 / 12 で確定。

## 7. DoD（Definition of Done）

- [ ] AC-1〜AC-11 全件 PASS（Phase 7 AC マトリクスで判定）
- [ ] `outputs/phase-11/` に `binding-grep.log` / `repository-grep.log` / `sql-1-dlq-pending.log` / `sql-2-retry-excess.log` / `sql-3-exhausted-stalled.log` / `aggregation.md` / `redaction-grep.log` が揃う
- [ ] `docs/runbooks/dlq-monitoring/schema-alias-backfill.md` が新規作成され §1〜§6 を満たす
- [ ] `.claude/skills/aiworkflow-requirements/references/dlq-monitoring.md`（または相当 references）に Queue/DLQ binding / D1 列 / しきい値 / runbook link が追記
- [ ] `aiworkflow-requirements/changelog/20260507-issue502-dlq-monitoring.md` に 1 行追加
- [ ] `outputs/phase-12/skill-references-diff.md` に追記 diff が記録
- [ ] `pnpm indexes:rebuild` で drift 0
- [ ] GitHub Issue #502 は CLOSED 据え置き（再 OPEN しない）
- [ ] PR 文面は `Refs #502`（`Closes #502` 不可）

## 8. 注意事項

- 本 Phase は **runbook の手順書化のみ**。実 `bash scripts/cf.sh d1 execute ...` 実行 / 実 markdown 追記 / 実 changelog 反映は Phase 11〜12 で行う
- `wrangler` 直接実行は **全面禁止**。すべて `bash scripts/cf.sh` 経由（CLAUDE.md「Cloudflare 系 CLI 実行ルール」準拠）
- D1 集計 SQL は **read-only に限定**。`UPDATE` / `DELETE` / `INSERT` / `DROP` / `ALTER` を含めない（Phase 9 で grep 検証）
- redaction grep のマッチ原文は **どのドキュメントにも転記禁止**。要約のみ runbook / references に記録
- DLQ 投入が 0 件で観測手順検証不可な場合は Phase 6 異常系 Case 2 に従い、staging fixture または synthetic insert で検証する
- Cloudflare Queue Analytics が Workers Paid 限定 feature の場合は Phase 6 異常系 Case 3 に従い D1 SQL のみで運用する経路にフォールバック

## 9. 不変条件への影響

| # | 不変条件 | 影響 | 対策 |
| --- | --- | --- | --- |
| 1〜7 | CLAUDE.md 全項目 | **影響なし** | コード / D1 schema / Cloudflare 構造 / Forms 操作なし。markdown 追記と read-only D1 query のみ |

## 10. 4 条件評価

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | step 1〜9 で AC-1〜AC-9 を一意に達成。後続実行者が runbook をそのまま実行すれば DLQ / retry / exhausted の状態が単一ビューで判定可能 |
| 実現性 | PASS | `bash scripts/cf.sh` / `rg` / `jq` のみで完結。新規ツール導入なし |
| 整合性 | PASS | 起票元仕様（`task-ut-07b-fu-01-followup-dlq-monitoring-dashboard.md`）の Phase 1〜5 と完全整合。CONST_004 例外（docs-only）と整合 |
| 運用性 | PASS | Issue CLOSED 据え置き / 集計 SQL は read-only / wrangler 直接実行を排除し scripts/cf.sh ラッパーに一本化 |

## 11. 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `docs/30-workflows/unassigned-task/task-ut-07b-fu-01-followup-dlq-monitoring-dashboard.md` | 起票元仕様 / 実行手順 |
| 必須 | `apps/api/wrangler.toml` | Queue / DLQ binding 名（read-only 参照） |
| 必須 | `apps/api/src/repository/schemaDiffQueue.ts` | `retry_count` / `failed_items_json` 永続化点（read-only 参照） |
| 必須 | `apps/api/migrations/0014_schema_diff_queue_dedupe_failure.sql` | `schema_diff_queue` schema（read-only 参照） |
| 必須 | `.claude/skills/aiworkflow-requirements/references/` | 追記先 |
| 必須 | `.claude/skills/aiworkflow-requirements/changelog/` | changelog 反映先 |
| 必須 | `scripts/cf.sh` | Cloudflare CLI ラッパー（wrangler 直接実行禁止） |
| 参考 | `docs/30-workflows/issue-497-post-release-dashboard-30day-conclusion/phase-05.md` | docs-only runbook フォーマット exemplar |

## 12. 苦戦箇所【記入必須】

- `bash scripts/cf.sh d1 execute` の出力に `last_error` 列の生メッセージ（OAuth エラー等）が含まれる可能性があり、無条件で runbook / skill references に貼ると AI 学習混入事故になる。本 Phase では step 7 で必ず redaction grep を挟み、マッチ原文は要約のみ記録するルールを step 8 セクション構造で固定した
- DLQ 観測手順を Cloudflare dash と D1 SQL の 2 経路で重複定義しがちだが、dash は Workers Paid feature 依存・SQL は無料で常時実行可能、という非対称があるため runbook §3 / §4 で **役割分担**（dash = 即時 metrics / SQL = 永続 evidence）を明記し、Phase 6 で Paid 限定リスクを別 Case として扱う方針にした
- `julianday('now') - julianday(last_processed_at) >= 1.0` の SQLite 関数は D1 で動くが、staging に十分な fixture が無いと結果 0 件で「異常なし / 動作不能」を区別できない。step 6 の aggregation.md に **観測サンプル件数** を必ず併記し、サンプル 0 件時は Phase 6 Case 2 にフォールバックする経路を確保した

## 13. 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | `outputs/phase-05/runbook.md` | step 1〜9 / 変更対象 / DoD / 入出力表 |
| メタ | `artifacts.json` | Phase 5 状態の更新 |

## 14. 次 Phase への引き渡し

- 次 Phase: 6（異常系）
- 引き継ぎ事項:
  - step 1〜9 の sequence
  - D1 集計 SQL 3 種の read-only 完成形
  - `bash scripts/cf.sh` ラッパー経由の実行ルール
  - 異常しきい値（DLQ ≥ 1 / retry ≥ 3 / exhausted 24h）
  - redaction grep 必須ルール
  - DoD 8 項目
- ブロック条件:
  - step のいずれかに `wrangler` 直接実行コマンドが含まれる
  - SQL に `UPDATE` / `DELETE` / `INSERT` / `DROP` / `ALTER` が混入
  - redaction grep のマッチ原文転記禁止ルールが欠落
  - skill references の追記先 / topic 名が決定していない

## 15. 実行タスク

- 本 Phase の本文に定義済みの判断、設計、検証、または文書更新を実行する
- docs-only / NON_VISUAL 境界を維持し、コード変更が必要になった場合は Phase 1 の taskType 判定へ戻す

## 16. 統合テスト連携

本タスクは docs-only / NON_VISUAL のため、unit / integration / e2e test の追加は N/A。代替として D1 集計 SQL の read-only grep 検証、redaction grep、Phase 12 strict 7 files、aiworkflow references 同期を検証ゲートとする。
