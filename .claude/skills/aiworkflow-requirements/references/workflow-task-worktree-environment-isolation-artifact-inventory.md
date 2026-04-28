# task-worktree-environment-isolation Artifact Inventory

## メタ情報

| 項目 | 内容 |
|---|---|
| タスクID | task-worktree-environment-isolation |
| タスク種別 | docs-only / NON_VISUAL |
| ワークフロー | spec_created |
| 作成日 | 2026-04-28 |
| owner | platform / dev-environment |
| domain | developer-experience |
| depends_on | task-conflict-prevention-skill-state-redesign |
| cross_task_order | conflict-prevention → lefthook → **worktree-environment-isolation** → branch-protection → claude-code-permissions |

## Acceptance Criteria

- skill symlink 撤去方針
- tmux session-scoped state
- gwt-auto lock
- NON_VISUAL evidence

## Phase Outputs（current canonical set）

| Phase | ファイル | 種別 | 説明 |
|---|---|---|---|
| 1 | `outputs/phase-1/main.md` | 要件 | 要件定義 |
| 2 | `outputs/phase-2/main.md` | 設計サマリ | Phase 2 サマリ |
| 2 | `outputs/phase-2/design.md` | 設計詳細 | skill symlink 撤去 / tmux session env / lockdir / shell state reset の設計 |
| 3 | `outputs/phase-3/main.md` | 設計レビュー | Phase 3 サマリ |
| 3 | `outputs/phase-3/review.md` | 設計レビュー本体 | 設計レビュー結果 |
| 4 | `outputs/phase-4/main.md` | テスト設計サマリ | Phase 4 サマリ |
| 4 | `outputs/phase-4/test-matrix.md` | テスト観点マトリクス | テストケース観点 |
| 5 | `outputs/phase-5/main.md` | 実装ランブックサマリ | Phase 5 サマリ |
| 5 | `outputs/phase-5/runbook.md` | 実装ランブック | `scripts/new-worktree.sh` 改修手順 |
| 6 | `outputs/phase-6/main.md` | テスト拡充サマリ | Phase 6 サマリ |
| 6 | `outputs/phase-6/failure-cases.md` | 失敗ケース | failure case 一覧 |
| 7 | `outputs/phase-7/main.md` | カバレッジサマリ | Phase 7 サマリ |
| 7 | `outputs/phase-7/coverage.md` | カバレッジ | カバレッジ確認 |
| 8 | `outputs/phase-8/main.md` | リファクタサマリ | Phase 8 サマリ |
| 8 | `outputs/phase-8/before-after.md` | before/after | リファクタ差分 |
| 9 | `outputs/phase-9/main.md` | 品質保証サマリ | Phase 9 サマリ |
| 9 | `outputs/phase-9/quality-gate.md` | 品質ゲート | 品質ゲート確認 |
| 10 | `outputs/phase-10/main.md` | 最終レビューサマリ | Phase 10 サマリ |
| 10 | `outputs/phase-10/go-no-go.md` | Go/No-Go | 最終 Go/No-Go 判断 |
| 11 | `outputs/phase-11/main.md` | 手動テストサマリ | Phase 11 サマリ |
| 11 | `outputs/phase-11/manual-smoke-log.md` | NON_VISUAL evidence | `tmux show-environment` / `find -type l` / 二重起動 exit 75 のログ3点 |
| 11 | `outputs/phase-11/link-checklist.md` | リンクチェック | docs リンク健全性 |
| 12 | `outputs/phase-12/main.md` | ドキュメント更新サマリ | Phase 12 サマリ |
| 12 | `outputs/phase-12/implementation-guide.md` | 実装ガイド | Part 1 概念 / Part 2 運用ランブック |
| 12 | `outputs/phase-12/system-spec-update-summary.md` | spec 更新一覧 | development-guidelines / lessons-learned / task-workflow への反映 |
| 12 | `outputs/phase-12/documentation-changelog.md` | 変更履歴 | doc-side changelog |
| 12 | `outputs/phase-12/unassigned-task-detection.md` | 未タスク検出 | follow-up 4件の起票元 |
| 12 | `outputs/phase-12/skill-feedback-report.md` | skill feedback | aiworkflow-requirements / task-specification-creator への反映指示 |
| 12 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | 準拠チェック | Phase 12 仕様準拠確認 |
| 13 | `outputs/phase-13/main.md` | 完了確認サマリ | user_approval_required=true |
| 13 | `outputs/phase-13/change-summary.md` | change summary | PR 用 change summary |
| 13 | `outputs/phase-13/pr-template.md` | PR テンプレート | PR 文面テンプレ |

## Skill 反映先（current canonical set）

| ファイル | 反映内容 |
|---|---|
| `.claude/skills/aiworkflow-requirements/references/development-guidelines-core.md` (L213〜) | worktree 入場時の `unset OP_SERVICE_ACCOUNT_TOKEN` / `hash -r` / `mise trust/install` / `mise exec --` 必須前処理 |
| `.claude/skills/aiworkflow-requirements/references/development-guidelines-details.md` (L197〜) | skill symlink 撤去 / tmux session-scoped env / mkdir lockdir / shell state reset の current contract |
| `.claude/skills/aiworkflow-requirements/references/lessons-learned-health-policy-worktree-2026-04.md` (§task-worktree-environment-isolation) | L-WTI-001〜008 |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | current task entry |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-backlog.md` | follow-up 4件 |
| `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` (L920〜) | Developer Environment / Worktree Isolation 章 |
| `.claude/skills/aiworkflow-requirements/indexes/keywords.json` (L14010〜) | task-worktree-environment-isolation / worktree-isolation キー追加 |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | Developer Environment / Worktree Isolation 導線セクション |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | Worktree Environment Isolation 検索パターン4領域 |

## 参照される実装ファイル（spec_created のため変更は伴わない）

| ファイル | 役割 |
|---|---|
| `scripts/new-worktree.sh` | worktree 作成 + lock + mise install ラッパ（後続実装タスクで改修対象） |
| `CLAUDE.md` (§ワークツリー作成) | ユーザ向け運用注意 |

## Follow-up 未タスク

| 未タスク | 概要 | 起票元 |
|---|---|---|
| 実装タスク（scripts/new-worktree.sh への反映） | spec を `scripts/new-worktree.sh` に反映 | `outputs/phase-12/unassigned-task-detection.md` |
| lockdir GC タスク | stale `.worktrees/.locks/*.lockdir` の owner metadata に基づく回収 | 同上 |
| tmux env probe タスク | tmux global env に `UBM_WT_*` 残留が無いことの定期検証 | 同上 |
| skill symlink CI gate タスク | pre-commit / CI で `find .claude/skills -type l` を検出 | 同上 |

## Validation Chain（spec_created）

| 検証項目 | 結果 |
|---|---|
| Phase 1〜13 outputs 揃っているか | PASS |
| Phase 11 NON_VISUAL evidence（ログ3点）固定 | PASS（`manual-smoke-log.md`） |
| Phase 12 canonical 6 成果物 | PASS |
| Phase 13 user approval required | PENDING（user_approval_required=true） |
| skill 反映 4 点セット | PASS（development-guidelines / lessons-learned / task-workflow-active / topic-map+keywords） |
