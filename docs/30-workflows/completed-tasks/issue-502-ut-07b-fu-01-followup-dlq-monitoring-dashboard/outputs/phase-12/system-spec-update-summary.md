# System Spec Update Summary — Issue #502

## 更新対象（実ファイル）

| # | パス | 区分 | 役割 |
| --- | --- | --- | --- |
| 1 | `docs/runbooks/dlq-monitoring/schema-alias-backfill.md` | 新規 | DLQ 監視 runbook 本体（6 章: 監視対象 / dash 手順 / 集計 SQL 3 種 / しきい値 / エスカレーション / しきい値見直し基準） |
| 2 | `.claude/skills/aiworkflow-requirements/references/dlq-monitoring.md` | 新規 | skill 逆引き topic（Queue/DLQ binding 名 + D1 列 + しきい値 + runbook link + ラッパー） |
| 3 | `.claude/skills/aiworkflow-requirements/changelog/20260507-issue502-dlq-monitoring.md` | 新規 | skill changelog fragment（1 行 entry + 反映内容） |
| 4 | `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` | 編集（自動生成） | 新 topic 追加分の drift 解消 |
| 5 | `.claude/skills/aiworkflow-requirements/indexes/keywords.json` | 編集（自動生成） | 新 keyword 追加分の drift 解消 |
| 6 | `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | 編集 | Issue #502 quick-ref 行追加 |
| 7 | `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | 編集 | Issue #502 resource エントリ追加 |
| 8 | `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | 編集 | Issue #502 active workflow 行追加 |
| 9 | `.claude/skills/aiworkflow-requirements/SKILL.md` | 編集 | 変更履歴に Issue #502 行追加 |
| 10 | `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md` | 編集 | 同一 wave LOGS 追記 |
| 11 | `docs/30-workflows/unassigned-task/task-ut-07b-fu-01-followup-dlq-monitoring-dashboard.md` | 編集（既存末尾） | 状態遷移 1 行追記（既追加済み） |
| 12 | `docs/30-workflows/issue-502-ut-07b-fu-01-followup-dlq-monitoring-dashboard/outputs/phase-11/*` | 新規 | 静的 evidence（grep ログ + read-only grep + redaction grep + aggregation + dash-observation）。実 D1 / dash runtime は user approval 後 |
| 13 | `docs/30-workflows/issue-502-ut-07b-fu-01-followup-dlq-monitoring-dashboard/outputs/phase-12/*` | 新規 | Phase 12 strict 7 成果物 |

> `topic-map.md` / `keywords.json` は `mise exec -- pnpm indexes:rebuild` 由来の自動生成差分。`quick-reference.md` / `resource-map.md` / `task-workflow-active.md` / `SKILL.md` / `LOGS/_legacy.md` は Issue #502 の逆引き導線を手動で同一 wave 追記した。

## runbook 本体構造（6 章）

```
1. 監視対象（Queue / DLQ binding 表 + D1 列表）
2. Cloudflare dash 観測手順（AC-1 / Workers Paid 制約フォールバック含む）
3. D1 集計 SQL 3 種（AC-2 / AC-7 read-only）
   3.1 DLQ 投入相当（failed_items_json IS NOT NULL）
   3.2 retry 過剰（retry_count >= 3）
   3.3 exhausted 滞留 24h 超
4. 異常しきい値（AC-3）
5. エスカレーション分岐（AC-4 / 軽微・中度・重度）
6. しきい値見直し基準（30/60/90 日）
7. 関連リソース（コード正本 + skill topic + 起票元仕様）
```

## skill references 構造（`dlq-monitoring.md`）

```
1. Queue / DLQ binding（環境別 3 列表）
2. 観測対象 D1 列（last_error は SELECT 禁止を明記）
3. 異常しきい値
4. runbook link（1-hop）
5. 実行ラッパー（wrangler 直接禁止）
6. エスカレーション
7. 関連 topic（observability-monitoring / deployment-cloudflare-opennext-workers / deployment-secrets-management）
8. 出典（起票元 / 親タスク / formalized 仕様書 / Issue #502）
```

## indexes 再生成方針

- 新 topic（`dlq-monitoring`）追加につき、`mise exec -- pnpm indexes:rebuild` を **必須実行**
- `git status .claude/skills/aiworkflow-requirements/indexes/` で index 差分を確認する。`topic-map.md` / `keywords.json` は generator、`quick-reference.md` / `resource-map.md` は Issue #502 の人間向け逆引き行を保持する
- CI gate `verify-indexes-up-to-date`（`.github/workflows/verify-indexes.yml`）が PR 上で再検証する

## 不変条件への影響

| # | 影響 |
| --- | --- |
| 1〜7 | **影響なし**（コード / D1 schema / Forms 構造 / Cloudflare 構造 全て無変更。markdown 追記 + read-only D1 query 手順正本化のみ） |

## アクセス点（D1 / Cloudflare 構造の不変性証跡）

- `apps/api/wrangler.toml` 変更なし（grep ログで既存 binding を read-only 参照）
- `apps/api/src/repository/schemaDiffQueue.ts` 変更なし（grep ログで永続化点を read-only 参照）
- `apps/api/migrations/0014_schema_diff_queue_dedupe_failure.sql` 変更なし（grep ログで schema を read-only 参照）

## GitHub 連携

- Issue #502: CLOSED 据え置き（reopen 禁止 / close 二重実行禁止）
- PR 文面: `Refs #502`（`Closes #502` 不可）
- PR 作成は Phase 13（user_approval_required = true）
