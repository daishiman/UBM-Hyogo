# Skill Feedback Report — Task C

> 改善点なしでも出力必須。テンプレ改善 / ワークフロー改善 / ドキュメント改善の 3 観点で記録する。
> 各 item に promotion target / no-op reason / evidence path を付す。

## 観点 1: テンプレ改善（task-specification-creator）

| Item | 内容 | promotion target | evidence path |
| --- | --- | --- | --- |
| FB-C-T-001 | 親 workflow から Task を切り出す際、元 skeleton の前提（route 配置・削除対象・package 名）が実コードベースと乖離するケースがある。Phase 1 で「skeleton 乖離是正テーブル」を必ず作る運用を patterns-lessons に明文化する | promoted: `.claude/skills/task-specification-creator/references/patterns-lessons-and-pitfalls.md` / `SKILL-changelog.md` | `phase-1-requirements.md` 是正テーブル / `index.md` skeleton 乖離是正セクション |

## 観点 2: ワークフロー改善（aiworkflow-requirements）

| Item | 内容 | promotion target | evidence path |
| --- | --- | --- | --- |
| FB-C-W-001 | route group 集約はユーザー確認分岐（URL 不変 mv vs 各 page 個別 mount）を持つ。実態調査 → ユーザー決定 → 是正の分岐を Phase 1 で確定する手順を lessons-learned 化する | promoted: `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-task-c-public-member-sidebar-shell-integration-2026-05.md` L-TASKC-001 | `index.md` skeleton 乖離是正（ユーザー決定: Option A）/ `phase-2-design.md` 価値とコスト |
| FB-C-W-002 | VISUAL タスクで production-equivalent running stack（認証済みセッション・API Worker・D1）が必要な場合、focused vitest / typecheck / lint を主ソースとし pixel screenshot を Gate-C へ deferring する evidence 境界記法 | promoted: `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-task-c-public-member-sidebar-shell-integration-2026-05.md` L-TASKC-002 | `outputs/phase-11/manual-test-result.md` evidence 境界 |

## 観点 3: ドキュメント改善

| Item | 内容 | promotion target | evidence path |
| --- | --- | --- | --- |
| FB-C-D-001 | shell 統合の navigation 正本（ui-ux-navigation.md）更新を、実コード GREEN 後に Step 1-A 同一ターンで反映する旨を documentation-changelog に Block 分離で記録する運用は有効。no-op（既に本サイクルで適用済み） | no-op（適用済み） | `outputs/phase-12/documentation-changelog.md` Block 2 |

## no-op item（改善不要だが記録）

| Item | no-op reason |
| --- | --- |
| compliance-check canonical 9 見出し | 既存テンプレ（`phase12-task-spec-compliance-template.md`）で十分。改修不要 |
| strict 7 構成 | 親 workflow / completed-tasks の書式を踏襲済み。乖離なし |

## 今回の主要知見（summary）

1. **skeleton と実 route group 配置の乖離を Phase 1 実態調査で是正したパターン** — 元 skeleton は 6 route が
   `(public)` 配下前提だったが、実態は `/` `/privacy` `/terms` `/login` が root 直下。Phase 1 で乖離テーブルを作り是正した。
2. **route group 集約のユーザー確認分岐** — URL 不変 `git mv` 集約（Option A）をユーザー決定として確定し、
   相対 import 深度補正・colocated test 追従を Phase 5 チェックリスト化した。
