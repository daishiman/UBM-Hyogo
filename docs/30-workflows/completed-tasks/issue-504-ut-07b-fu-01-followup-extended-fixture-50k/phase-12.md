# Phase 12: implementation guide / SSOT 更新 / unassigned 検出 / skill feedback / compliance

## メタ情報
| 項目 | 値 |
| --- | --- |
| Source | `outputs/phase-12/main.md` |
| 必須タスク数 | 6 |

## 目的
Phase 12 の 6 必須タスクを実行し、最低 7 ファイルを実体生成する（`references/phase-12-spec.md` 準拠）。

## 実行タスク
1. **Task 12-1: 実装ガイド作成** (`outputs/phase-12/implementation-guide.md`)
   - Part 1（中学生レベル概念）: 「50,000 行のテストデータを使って、Queue 分割の効果を測定する仕組み」
   - Part 2（技術者レベル）: fixture 採番 / production guard 二重化 / 10 trials evidence schema / cursor follow-up 連携
2. **Task 12-2: システム仕様書更新** (`outputs/phase-12/system-spec-update-summary.md`)
   - Step 1-A: aiworkflow-requirements `schema-alias-backfill-runbook.md` 更新（Phase 9 で実施済を確認）
   - Step 1-B: indexes 反映確認
3. **Task 12-3: ドキュメント更新履歴** (`outputs/phase-12/documentation-changelog.md`)
   - 必須エントリ: `.claude/skills/aiworkflow-requirements/SKILL.md`, `.claude/skills/aiworkflow-requirements/LOGS.md`, `references/schema-alias-backfill-runbook.md`, `indexes/keywords.json`, 親 workflow `phase-11/extended-fixture-50k-evidence.md`, 本タスク `index.md`, 本タスク `outputs/phase-12/*`
4. **Task 12-4: 未タスク検出** (`outputs/phase-12/unassigned-task-detection.md`)
   - 0 件でも出力必須。本タスクで派生し得る候補: cursor semantics 採用判断（既存 follow-up）、production への安全な大規模 back-fill 手順策定（別 issue）
5. **Task 12-5: skill feedback** (`outputs/phase-12/skill-feedback-report.md`)
   - 改善点なしでも出力必須。3 観点固定: テンプレ改善 / ワークフロー改善 / ドキュメント改善
6. **Task 12-6: コンプライアンスチェック** (`outputs/phase-12/phase12-task-spec-compliance-check.md`)
   - 7 ファイル実体確認、artifacts.json と整合確認、redaction grep PASS

## 完了条件
- 7 ファイル実体存在
- artifacts.json `phases.phase-12.status` が `completed` または `completed_local_sync`
- redaction CI gate PASS
- aiworkflow-requirements indexes drift なし

## 参照資料
- `.claude/skills/task-specification-creator/references/phase-12-spec.md`
- `.claude/skills/task-specification-creator/references/phase-12-pitfalls.md`

## 成果物
- `outputs/phase-12/main.md`
- `outputs/phase-12/implementation-guide.md`
- `outputs/phase-12/system-spec-update-summary.md`
- `outputs/phase-12/documentation-changelog.md`
- `outputs/phase-12/unassigned-task-detection.md`
- `outputs/phase-12/skill-feedback-report.md`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`
