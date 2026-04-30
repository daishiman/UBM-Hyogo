# documentation-changelog — UT-04 D1 データスキーマ設計

> workflow-local 同期 と global skill sync を別ブロックで記録（[Feedback BEFORE-QUIT-003] 対策）。

## ブロック A: workflow-local 同期（本タスクのリポジトリ内ファイル）

| 日付 | 変更種別 | 対象ファイル | 変更概要 |
| --- | --- | --- | --- |
| 2026-04-29 | 新規 | `docs/30-workflows/ut-04-d1-schema-design/index.md` | UT-04 タスク仕様書 index |
| 2026-04-29 | 新規 | `docs/30-workflows/ut-04-d1-schema-design/phase-01.md` 〜 `phase-13.md` | 13 Phase 仕様書 |
| 2026-04-29 | 新規 | `docs/30-workflows/ut-04-d1-schema-design/artifacts.json` | root ledger（`metadata.workflow_state=spec_created` / `metadata.docsOnly=true`） |
| 2026-04-29 | 新規 | `docs/30-workflows/ut-04-d1-schema-design/outputs/artifacts.json` | 生成物 ledger（root と同期） |
| 2026-04-29 | 新規 | `docs/30-workflows/ut-04-d1-schema-design/outputs/phase-11/main.md` | NON_VISUAL evidence サマリー |
| 2026-04-29 | 新規 | `docs/30-workflows/ut-04-d1-schema-design/outputs/phase-11/manual-smoke-log.md` | 7 命令分の手順 + TBD ログ |
| 2026-04-29 | 新規 | `docs/30-workflows/ut-04-d1-schema-design/outputs/phase-11/link-checklist.md` | L1〜L4 リンク検証 |
| 2026-04-29 | 新規 | `docs/30-workflows/ut-04-d1-schema-design/outputs/phase-12/main.md` | Phase 12 ナビ |
| 2026-04-29 | 新規 | `docs/30-workflows/ut-04-d1-schema-design/outputs/phase-12/implementation-guide.md` | Part 1 + Part 2 |
| 2026-04-29 | 新規 | `docs/30-workflows/ut-04-d1-schema-design/outputs/phase-12/system-spec-update-summary.md` | Step 1-A/B/C + Step 2 N/A |
| 2026-04-29 | 新規 | `docs/30-workflows/ut-04-d1-schema-design/outputs/phase-12/documentation-changelog.md` | 本ファイル |
| 2026-04-29 | 新規 | `docs/30-workflows/ut-04-d1-schema-design/outputs/phase-12/unassigned-task-detection.md` | 未タスク formalize |
| 2026-04-29 | 新規 | `docs/30-workflows/ut-04-d1-schema-design/outputs/phase-12/skill-feedback-report.md` | 3 skill フィードバック |
| 2026-04-29 | 新規 | `docs/30-workflows/ut-04-d1-schema-design/outputs/phase-12/phase12-task-spec-compliance-check.md` | 必須 7 ファイル PASS 判定 |
| 2026-04-29 | 新規 | `docs/30-workflows/unassigned-task/task-ut-09-member-responses-table-name-drift.md` | UT-09 主テーブル名 drift cleanup 未タスク |
| 2026-04-29 | 新規 | `docs/30-workflows/unassigned-task/task-ut-04-shared-zod-codegen.md` | DDL→型派生 follow-up 未タスク |
| 2026-04-29 | 新規 | `docs/30-workflows/unassigned-task/task-ut-04-seed-data-runbook.md` | seed / fixture runbook follow-up 未タスク |
| 2026-04-29 | 新規 | `docs/30-workflows/unassigned-task/task-ut-04-sync-ledger-transition-plan.md` | sync ledger transition follow-up 未タスク |
| 2026-04-29 | 更新 | `docs/30-workflows/unassigned-task/UT-04-d1-schema-design.md` | 状態 `unassigned` → `spec_created` + 後継 workflow 追記 |

## ブロック B: global skill sync（`.claude/skills/aiworkflow-requirements/`）

| 日付 | 変更種別 | 対象ファイル | 変更概要 |
| --- | --- | --- | --- |
| 2026-04-29 | 同期 | `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` | UT-04 workflow 導線 |
| 2026-04-29 | 同期 | `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | workflow inventory |
| 2026-04-29 | 同期 | `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | UT-04 spec sync root |
| 2026-04-29 | 同期 | `.claude/skills/aiworkflow-requirements/indexes/keywords.json` | 索引再生成 |
| 2026-04-29 | 更新 | `.claude/skills/aiworkflow-requirements/SKILL.md` | UT-04 close-out sync を変更履歴に追加 |
| 2026-04-29 | 更新 | `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md` | UT-04 sync 実行ログを追加（`LOGS.md` は archive index 移行済み） |
| 2026-04-29 | 更新 | `.claude/skills/aiworkflow-requirements/references/database-schema.md` | DDL 同期テンプレ導線を追加 |
| 2026-04-29 | 新規 | `.claude/skills/aiworkflow-requirements/references/database-schema-ddl-template.md` | DDL 反映テンプレを責務分離 |
| 2026-04-29 | 新規 | `.claude/skills/aiworkflow-requirements/references/database-indexes.md` | インデックス一覧を責務分離し 500 行制限を回避 |
| 2026-04-29 | 更新 | `.claude/skills/aiworkflow-requirements/references/lessons-learned.md` | UT-04 lessons hub 行を追加 |
| 2026-04-29 | 更新 | `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | UT-04 active/spec_created ledger 行を追加 |

## ブロック B-2: task-specification-creator skill sync

| 日付 | 変更種別 | 対象ファイル | 変更概要 |
| --- | --- | --- | --- |
| 2026-04-29 | 更新 | `.claude/skills/task-specification-creator/SKILL.md` | Phase 12 一括 SubAgent 実行プロファイル反映を変更履歴に追加 |
| 2026-04-29 | 更新 | `.claude/skills/task-specification-creator/LOGS/_legacy.md` | 本スキル反映の実行ログを追加（`LOGS.md` は存在しない） |
| 2026-04-29 | 更新 | `.claude/skills/task-specification-creator/references/phase-12-documentation-guide.md` | 監査並列 / 編集直列 / Step 2 owner 固定 / status 標準表を正本化 |
| 2026-04-29 | 更新 | `.claude/skills/task-specification-creator/references/phase-12-spec.md` | 三併存ケースと Step 2 N/A 判定例を補強 |
| 2026-04-29 | 更新 | `.claude/skills/task-specification-creator/references/phase-12-pitfalls.md` | Phase 12 close-out の漏れパターンを補強 |

## ブロック C: 関連タスク双方向リンク（Step 1-C 結果）

| 日付 | 変更種別 | 対象ファイル | 変更概要 |
| --- | --- | --- | --- |
| 2026-04-29 | 更新 | `docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/index.md` | 上流に UT-04 を追加 |
| 2026-04-29 | 更新 | `docs/30-workflows/ut-21-sheets-d1-sync-endpoint-and-audit-implementation/index.md` | 上流に UT-04 を追加 |
| 2026-04-29 | 更新 | `docs/00-getting-started-manual/specs/08-free-database.md` | 参照タスク欄に UT-04 |

## drift チェック

- root `artifacts.json` と `outputs/artifacts.json` は `metadata.workflow_state=spec_created` / `metadata.docsOnly=true` / `phases[*].status` が一致していること
- `apps/api/migrations/*.sql` は本 PR に **非混入**（実 DDL は実装 PR で別途投入）
